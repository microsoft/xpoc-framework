// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    Platforms,
    type XPOCManifest,
    type Account,
    type ContentItem,
    Manifest,
} from 'xpoc-ts-lib';

const DOWNLOAD_TIMEOUT = Number.parseInt(
    process.env.DOWNLOAD_TIMEOUT ?? ('5000' as string),
);

/**
 * Retrieves the base URL from a given URL by removing any query parameters and trailing slashes.
 * If the URL is from YouTube and contains a 'v' query parameter, it will be included in the base URL.
 * @param url - The input URL.
 * @returns The base URL.
 */
function getBaseURL(url: string) {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    const queryParams: string[] = [];
    if (urlObj.hostname.includes('youtube') && searchParams.has('v')) {
        queryParams.push(`v=${searchParams.get('v')}`);
    }
    const queryParamsString =
        queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    const baseURL = (
        urlObj.origin +
        urlObj.pathname +
        queryParamsString
    ).replace(/\/$/, '');
    //.toLowerCase();
    return baseURL;
}

/**
 * Downloads the XPOC manifest for the given XPOC URI.
 * @param xpocUri The XPOC URI.
 * @returns A promise that resolves to the downloaded XPOC manifest or an Error object if the URI is invalid.
 */
async function downloadManifest(
    xpocUri: string,
): Promise<XPOCManifest | Error> {
    if (!xpocUri.startsWith('xpoc://')) {
        return new Error(`Invalid XPOC URI: ${xpocUri}`);
    }

    const manifestUrl =
        xpocUri
            // replace the xpoc:// prefix with https://
            .replace(/^xpoc:\/\//, 'https://')
            // remove trailing !
            .replace(/!$/, '')
            // remove trailing slash, if present
            .replace(/\/$/, '') +
        // append the XPOC manifest path
        '/xpoc-manifest.json';

    const manifest = await fetchWithTimeout<XPOCManifest>(manifestUrl);

    return manifest;
}

/**
 * Fetches data from the specified URL with a timeout.
 * @param url - The URL to fetch data from.
 * @param options - The options for the fetch request.
 * @param timeout - The timeout duration in milliseconds.
 * @returns A promise that resolves to the fetched data or an error.
 */
async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeout = DOWNLOAD_TIMEOUT,
): Promise<T | Error> {
    // add controller to options so we can abort the fetch on timeout
    const controller = new AbortController();
    const signal = controller.signal;

    options = {
        ...options,
        signal,
        method: options.body == null ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    const response: Response | Error = await fetch(url, { ...options, signal })
        .catch((error) => {
            console.log('fetch error', error);
            // if the fetch was aborted, throw a timeout error instead
            if (error.name === 'AbortError') {
                return new Error(`HTTP timeout of ${timeout}ms to ${url}`);
            } else {
                return new Error(`HTTP error: ${error}`);
            }
        })
        .finally(() => {
            clearTimeout(timeoutId);
        });

    if (response instanceof Error) {
        return response;
    }

    if (!response.ok) {
        return new Error(`HTTP error: ${response.status}`);
    }

    return await response.json().catch((error) => {
        return new Error(`Error parsing manifest: ${error}`);
    });
}

export type lookupXpocUriResult =
    | {
          type: 'account';
          name: string;
          baseurl: string;
          version: string;
          account: Account;
      }
    | {
          type: 'content';
          name: string;
          baseurl: string;
          version: string;
          content: ContentItem;
      }
    | {
          type: 'notFound';
          baseurl: string;
      }
    | {
          type: 'error';
          baseurl: string;
          message: string;
      };

/**
 * Looks up the XPoc URI for a given tab URL and XPoc URL.
 * @param tabUrl The URL of the tab.
 * @param xpocUrl The URL of the XPoc.
 * @returns A promise that resolves to the lookup result.
 */
export async function lookupXpocUri(
    tabUrl: string,
    xpocUrl: string,
): Promise<lookupXpocUriResult> {
    console.log('lookupXpocUri called', tabUrl, xpocUrl);
    const manifest = await downloadManifest(xpocUrl);

    if (manifest instanceof Error) {
        console.log('Error fetching manifest:', manifest.message);
        return {
            type: 'error',
            baseurl: xpocUrl,
            message: `Error fetching manifest: ${manifest.message}`,
        };
    }

    console.log(Manifest.validate(manifest));

    // check each manifest account to see if it matches the current tab url
    tabUrl = getBaseURL(tabUrl as string);
    const matchingAccount = manifest.accounts?.find((account: Account) => {
        // skip account if no url is specified
        if (!account.url) {
            return false;
        }
        // get the platform object for this account
        const platform = Platforms.isSupportedPlatform(account.platform)
            ? Platforms.getPlatform(account.platform)
            : undefined;
        if (platform && platform?.isValidAccountUrl(tabUrl)) {
            const canonicalizedTabUrl = platform.canonicalizeAccountUrl(tabUrl);
            const canonicalizedAccountUrl = platform.canonicalizeAccountUrl(
                account.url,
            );
            return (
                canonicalizedTabUrl.account === canonicalizedAccountUrl.account
            );
        }
        // tab url possibly matches this account but is not a supported platform
        else {
            if (tabUrl === getBaseURL(account.url)) {
                return true;
            }
        }
        return false;
    });

    if (matchingAccount) {
        console.log('Content found in manifest', matchingAccount);
        return {
            type: 'account',
            name: manifest.name,
            baseurl: manifest.baseurl,
            version: manifest.version,
            account: matchingAccount,
        };
    }

    const matchingContent = manifest.content?.find((content: ContentItem) => {
        // get the platform object for this account
        const platform = Platforms.isSupportedPlatform(content.platform)
            ? Platforms.getPlatform(content.platform)
            : undefined;
        if (platform && platform?.isValidContentUrl(tabUrl)) {
            const canonicalizedTabUrl = platform.canonicalizeContentUrl(tabUrl);
            const canonicalizedManifestContentUrl =
                platform.canonicalizeContentUrl(content.url);
            return (
                canonicalizedTabUrl.url === canonicalizedManifestContentUrl.url
            );
        }
        // tab url possibly matches this content but is not a supported platform
        else {
            if (tabUrl === getBaseURL(content.url)) {
                return true;
            }
        }
        return false;
    });

    if (matchingContent) {
        console.log('Content found in manifest', matchingContent);
        return {
            type: 'content',
            name: manifest.name,
            baseurl: manifest.baseurl,
            version: manifest.version,
            content: matchingContent,
        };
    }

    console.log('Content not found in manifest');
    return { type: 'notFound', baseurl: manifest.baseurl };
}
