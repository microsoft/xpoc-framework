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
export function getBaseURL(url: string) {
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

function getUrlFromUri(uri: string, scheme = 'xpoc' || 'trust'): string {
    const file = scheme === 'xpoc' ? '/xpoc-manifest.json' : '/trust.txt';
    return uri
        // replace the xpoc:// prefix with https://
        .replace(/^xpoc:\/\//, 'https://')
        // replace the trust:// prefix with https://
        .replace(/^trust:\/\//, 'https://')
        // remove trailing !
        .replace(/!$/, '')
        // remove trailing slash, if present
        .replace(/\/$/, '') +
    // append the file path
    file;
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

    const manifestUrl = getUrlFromUri(xpocUri, 'xpoc');
    const manifest = await fetchObject<XPOCManifest>(manifestUrl);

    return manifest;
}

/**
 * Fetches data from the specified URL with a timeout.
 * @param url - The URL to fetch data from.
 * @param options - The options for the fetch request.
 * @param timeout - The timeout duration in milliseconds.
 * @returns A promise that resolves to the fetched data or an error.
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = DOWNLOAD_TIMEOUT,
): Promise<Response | Error> {
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

    return response
}

async function fetchObject<T> (
        url: string,
        options: RequestInit = {},
        timeout = DOWNLOAD_TIMEOUT,
    ): Promise<T | Error> {
        const responseOrError = await fetchWithTimeout(url, options, timeout);
        if (responseOrError instanceof Error) {
            return responseOrError;
        }
        const response = responseOrError as Response;

        return await response.json().catch((error: Error) => {
            return new Error(`JSON parse error: ${error}`);
        });
    }
    


async function fetchText (
        url: string,
        options: RequestInit = {},
        timeout = DOWNLOAD_TIMEOUT,
    ): Promise<string | Error> {
        const responseOrError = await fetchWithTimeout(url, options, timeout);
        if (responseOrError instanceof Error) {
            return responseOrError;
        }
        const response = responseOrError as Response;

        return await response.text().catch((error: Error) => {
            return new Error(`text parse error: ${error}`);
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

/*
 * Trust.txt handlers (tried to put that in its own file but bundler would need updating)
 */

/**
 * A trust.txt file.
 */
export type TrustTxtFile = {
    member: string[];
    belongto: string[];
    control: string[];
    controlledby: string[];
    social: string[];
    vendor: string[];
    customer: string[];
    disclosure: string[];
    contact: string[];
    datatrainingallowed: boolean;
};

/**
 * Downloads the trust.txt file for the given trust URI.
 * @param trustUri The trust URI.
 * @returns A promise that resolves to the downloaded trust.txt file or an Error object if the URI is invalid.
 */
async function downloadTrustTxt(
    trustUri: string,
): Promise<TrustTxtFile | Error> {
    if (!trustUri.startsWith('trust://')) {
        return new Error(`Invalid trust URI: ${trustUri}`);
    }

    const trustUrl = getUrlFromUri(trustUri, 'trust');
    const trustTxtContent = await fetchText(trustUrl);
    if (trustTxtContent instanceof Error) {
        return trustTxtContent;
    }
    const trustTxtFile = parseTrustTxt(trustTxtContent);
    return trustTxtFile;
}

function parseTrustTxt(trustTxtContent: string): TrustTxtFile {
    const trustTxtFile: TrustTxtFile = {
        member: [],
        belongto: [],
        control: [],
        controlledby: [],
        social: [],
        vendor: [],
        customer: [],
        disclosure: [],
        contact: [],
        datatrainingallowed: false
    }

    const lines = trustTxtContent.split('\n');
    for (const line of lines) {
        const cleanedLine = line.trim();

        // Skip empty lines and comments
        if (!cleanedLine || cleanedLine.startsWith('#')) {
            continue;
        }

        const [variable, value] = cleanedLine.split('=');

        if (!variable || !value) {
            continue;
        }

        const cleanedVariable = variable.trim().toLowerCase();
        const trimmedValue = value.trim();

        switch (cleanedVariable) {
            case 'member':
                trustTxtFile.member.push(trimmedValue);
                break;
            case 'belongto':
                trustTxtFile.belongto.push(trimmedValue);
                break;
            case 'control':
                trustTxtFile.control.push(trimmedValue);
                break;
            case 'controlledby':
                trustTxtFile.controlledby.push(trimmedValue);
                break;
            case 'social':
                trustTxtFile.social.push(trimmedValue);
                break;
            case 'vendor':
                trustTxtFile.vendor.push(trimmedValue);
                break;
            case 'customer':
                trustTxtFile.customer.push(trimmedValue);
                break;
            case 'disclosure':
                trustTxtFile.disclosure.push(trimmedValue);
                break;
            case 'contact':
                trustTxtFile.contact.push(trimmedValue);
                break;
            case 'datatrainingallowed':
                trustTxtFile.datatrainingallowed = trimmedValue.toLowerCase() === 'yes';
                break;
            default:
                console.warn(`Unknown variable: ${cleanedVariable}`);
        }
    }

    return trustTxtFile;
}

/**
 * Looks up the trust URI for a given tab URL and trust URL.
 * @param tabUrl The URL of the tab.
 * @param xpocUrl The URL of the trust.txt file.
 * @returns A promise that resolves to the lookup result.
 */
export async function lookupTrustUri(
    tabUrl: string,
    trustUrl: string,
): Promise<lookupXpocUriResult> {
    console.log('lookupTrustUri called', tabUrl, trustUrl);
    const trustTxtFile = await downloadTrustTxt(trustUrl);

    if (trustTxtFile instanceof Error) {
        console.log('Error fetching trust.txt file:', trustTxtFile.message);
        return {
            type: 'error',
            baseurl: trustUrl,
            message: `Error fetching trust.txt file: ${trustTxtFile.message}`,
        };
    }

    // check each trust.txt file social account to see if it matches the current tab url
    tabUrl = getBaseURL(tabUrl as string);
    const matchingAccountUrl = trustTxtFile.social?.find((account: string) => {
        // get the platform object for this account
        const platform = Platforms.isSupportedAccountUrl(account)
            ? Platforms.getPlatformFromAccountUrl(account)
            : undefined;
        if (platform && platform?.isValidAccountUrl(tabUrl)) {
            const canonicalizedTabUrl = platform.canonicalizeAccountUrl(tabUrl);
            const canonicalizedAccountUrl = platform.canonicalizeAccountUrl(account);
            return (
                canonicalizedTabUrl.account === canonicalizedAccountUrl.account
            );
        }
        // tab url possibly matches this account but is not a supported platform
        else {
            if (tabUrl === getBaseURL(account)) {
                return true;
            }
        }
        return false;
    });

    if (matchingAccountUrl) {
        console.log('Content found in trust.txt file', matchingAccountUrl);
        const platform = Platforms.getPlatformFromAccountUrl(matchingAccountUrl)?.DisplayName || '';
        let account = matchingAccountUrl;
        if (platform) {
            account = Platforms.getPlatform(platform).canonicalizeAccountUrl(matchingAccountUrl).account;
        }
        const url = getUrlFromUri(trustUrl, 'trust');
        const domain = new URL(url).hostname;
        return {
            type: 'account',
            name: domain,
            baseurl: domain,
            version: 'trust.txt-draft00',
            account: {
                account: account,
                platform: platform

            }
        };
    }

    console.log('Content not found in manifest');
    return { type: 'notFound', baseurl: trustUrl };
}
