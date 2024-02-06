// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/*
    A more robust fetch function wrapper.
    - allows for configurable timeout with .env file or parameter (fetch does not have a timeout option)
    - wraps expected errors in a FetchError class. The function will return a FetchError or a parsed JSON object.
    - detects probable CORS errors
*/

const DEFAULT_TIMEOUT = 10000;
const MAX_TIMEOUT = 30000;
const MIN_TIMEOUT = 1000;

export enum FetchErrors {
    CLIENT = 'CLIENT-ERROR',
    CORS = 'CORS',
    JSON = 'JSON',
    NETWORK = 'NETWORK',
    NOT_FOUND = 'NOT-FOUND',
    SERVER = 'SERVER-ERROR',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN',
}

/**
 * FetchError class.
 * Extend error to add a code property.
 */
export class FetchError extends Error {
    constructor(
        public code: FetchErrors,
        message?: string,
    ) {
        super(message);
        this.name = 'FetchError';
        this.message = message ?? '';
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
        };
    }
}

/**
 * Determines the timeout to use for fetch requests. From the .env file and user input.
 *
 * @param {number} [timeout] - Optional timeout in milliseconds.
 * @returns {number} - Timeout in milliseconds.
 */
function determineTimeout(timeout?: number): number {
    // if not defined, get from env var
    if (timeout == null) {
        const envStr = process.env.DOWNLOAD_TIMEOUT;
        if (envStr == null) {
            return DEFAULT_TIMEOUT;
        }
        // try parse
        const parsed = parseInt(envStr);
        if (isNaN(parsed)) {
            console.warn(
                `Invalid HTTP_TIMEOUT. Env var DOWNLOAD_TIMEOUT cannot be parsed as a number. Using default of ${DEFAULT_TIMEOUT}ms.`,
            );
            return DEFAULT_TIMEOUT;
        }
        // let the number value pass-through to the next range check
        timeout = parsed;
    }

    if (typeof timeout === 'number') {
        if (timeout < MIN_TIMEOUT || timeout > MAX_TIMEOUT) {
            console.warn(
                `Invalid HTTP_TIMEOUT. Value of ${timeout}ms, timeout should be between ${MIN_TIMEOUT} and ${MAX_TIMEOUT}ms. Using default of ${DEFAULT_TIMEOUT}ms`,
            );
            return DEFAULT_TIMEOUT;
        }
        return timeout;
    }

    // if we get here, timeout was passed in, but is not a number
    console.warn(
        `Invalid HTTP_TIMEOUT. Value of '${timeout}', timeout should be between ${MIN_TIMEOUT} and ${MAX_TIMEOUT}ms. Using default of ${DEFAULT_TIMEOUT}ms`,
    );
    return DEFAULT_TIMEOUT;
}

/**
 * Download JSON text from a URL and return it as an object of type T.
 * Fetch does not allow for a configurable timeout, so we implement it ourselves.
 * If the timeout is not specified, it defaults to a value from the .env file or DEFAULT_TIMEOUT milliseconds.
 *
 * @template T The type of the object to return from parsed JSON text.
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} options - Request options. The method (GET/POST) is determined by the presence of a body.
 * @param {number} [timeout] - Optional timeout in milliseconds.
 * @returns {Promise<T | FetchError>} - The JSON object or an Error.
 */
export async function fetchObject<T>(
    url: string,
    options: RequestInit = {},
    timeout?: number,
): Promise<T | FetchError> {
    timeout = determineTimeout(timeout);

    // automatically set the method and content-type if the body is present
    // content-type': 'text/plain' will prevent preflight cors requests
    options = {
        ...options,
        headers: { 'content-type': 'text/plain', ...options.headers },
        method: options.body == null ? 'GET' : 'POST',
    };

    const start = Date.now();
    const response = await fetchWithTimeout(url, options, timeout);

    // Error returned for cors errors, network errors, aborted, or non-existent url
    if (response instanceof Error) {
        // if the fetch was aborted, throw a timeout error instead
        if (response.name === 'AbortError') {
            return new FetchError(
                FetchErrors.TIMEOUT,
                `Client timeout of ${timeout}ms to ${url}`,
            );
        }

        // cors, network, or non-existent url
        // cors supersedes other errors
        if (response instanceof TypeError) {
            // possible cors error, fetch again with no-cors mode.
            const noCorsFetch = await fetchWithTimeout(
                url,
                { ...options, mode: 'no-cors' },
                timeout,
            );
            // it failed again, so it's not a cors error. Return the original error
            if (noCorsFetch instanceof Error) {
                return new FetchError(
                    FetchErrors.NETWORK,
                    `Non existent URL ${url} or Network error`,
                );
            }
            // it succeeded with an opaque response, so it was a likely cors error
            if (noCorsFetch.ok === false && noCorsFetch.type === 'opaque') {
                return new FetchError(
                    FetchErrors.CORS,
                    `Probable CORS error to ${url}`,
                );
            }
        }

        return new FetchError(FetchErrors.UNKNOWN, `Fetch failed to ${url}`);
    }

    if (response.ok === false) {
        if (response.status === 404 /* not found */) {
            return new FetchError(
                FetchErrors.NOT_FOUND,
                `URL ${url} not found`,
            );
        }

        if (response.status >= 400 && response.status < 500) {
            return new FetchError(
                FetchErrors.CLIENT,
                `Fetch client error ${response.status}`,
            );
        }

        if (response.status === 504 /* gateway timeout */) {
            return new FetchError(
                FetchErrors.TIMEOUT,
                `Server timeout of ${
                    Math.floor((Date.now() - start) / 100) * 100
                } ms to ${url}`,
            );
        }

        if (response.status >= 500 && response.status < 600) {
            return new FetchError(
                FetchErrors.SERVER,
                `Fetch server error ${response.status}`,
            );
        }
    }

    // parse the response as JSON
    return await response.json().catch((error: Error) => {
        return new FetchError(FetchErrors.JSON, `JSON parse error: ${error}`);
    });
}

/**
 * Fetch with timeout.
 *
 * @param url {string}
 * @param options {RequestInit}
 * @param timeout {number}
 * @returns {Promise<Response | Error>} - The response or an Error.
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number,
): Promise<Response | Error> {
    // add controller to options so we can abort the fetch on timeout
    const controller = new AbortController();
    const signal = controller.signal;
    options = { ...options, signal };
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);
    return await fetch(url, { ...options, signal })
        // catch occurs on cors errors, network errors, aborted, or non-existent url
        .catch((error: Error) => {
            return error;
        })
        .finally(() => {
            clearTimeout(timeoutId);
        });
}
