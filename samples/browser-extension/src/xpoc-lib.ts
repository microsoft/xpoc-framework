// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Platforms, type XPOCManifest, type Account, type ContentItem, Manifest } from 'xpoc-ts-lib'

const DOWNLOAD_TIMEOUT = Number.parseInt(process.env.DOWNLOAD_TIMEOUT ?? "5000" as string)

function getBaseURL(url: string) {
    const urlObj = new URL(url);
    let searchParams = urlObj.searchParams;
    let queryParams: string[] = [];
    if (urlObj.hostname.includes('youtube') && searchParams.has('v')) {
        queryParams.push(`v=${searchParams.get('v')}`);
    }
    const queryParamsString =
        queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    const baseURL = (urlObj.origin + urlObj.pathname + queryParamsString)
        .replace(/\/$/, '')
    //.toLowerCase();
    return baseURL;
}

async function downloadManifest(xpocUri: string): Promise<XPOCManifest | Error> {

    if (!xpocUri.startsWith('xpoc://')) {
        return new Error(`Invalid XPOC URI: ${xpocUri}`)
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

    const manifest = await fetchWithTimeout<XPOCManifest>(manifestUrl)

    return manifest
}

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}, timeout = DOWNLOAD_TIMEOUT): Promise<T | Error> {
    // add controller to options so we can abort the fetch on timeout
    const controller = new AbortController()
    const signal = controller.signal

    options = { ...options, signal, method: (options.body == null) ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' } }

    const timeoutId = setTimeout(() => { controller.abort() }, timeout)

    const response = await fetch(url, { ...options, signal })
        .catch(error => {
            console.log('fetch error', error)
            // if the fetch was aborted, throw a timeout error instead
            if (error.name === 'AbortError') {
                return new Error(`HTTP timeout of ${timeout}ms to ${url}`)
            } else {
                return error
            }
        })
        .finally(() => { clearTimeout(timeoutId) })

    if (!response.ok) {
        return new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
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
    }
    | {
        type: 'error';
        message: string;
    }

export async function lookupXpocUri(tabUrl: string, xpocUrl: string): Promise<lookupXpocUriResult> {

    const manifest = await downloadManifest(xpocUrl)

    if (manifest instanceof Error) {
        console.error('Error fetching manifest:', manifest);
        return { type: 'error', message: `Error fetching manifest: ${manifest.message}` }
    }

    console.log(Manifest.validate(manifest))

    // check each manifest account to see if it matches the current tab url
    tabUrl = getBaseURL(tabUrl as string);
    const matchingAccount = manifest.accounts.find(
        (account: Account) => {
            // get the platform object for this account
            const platform = Platforms.isSupportedPlatform(account.platform) ? Platforms.getPlatform(account.platform) : undefined
            if (platform) {
                const canonicalizedTabUrl = platform.canonicalizeAccountName(tabUrl)
                const canonicalizedAccountUrl = platform.canonicalizeAccountName(account.url)
                return canonicalizedTabUrl === canonicalizedAccountUrl
            }
            // tab url possibly matches this account but is not a supported platform
            else {
                if (tabUrl === getBaseURL(account.url)) {
                    return true
                }
            }
            return false
        }
    );

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

    const matchingContent = manifest.content.find(
        (content: ContentItem) => {
            // get the platform object for this account
            const platform = Platforms.isSupportedPlatform(content.platform) ? Platforms.getPlatform(content.platform) : undefined
            if (platform) {
                const canonicalizedTabUrl = platform.canonicalizeAccountName(tabUrl)
                const canonicalizedAccountUrl = platform.canonicalizeAccountName(content.url)
                return canonicalizedTabUrl === canonicalizedAccountUrl
            }
            // tab url possibly matches this content but is not a supported platform
            else {
                if (tabUrl === getBaseURL(content.url)) {
                    return true
                }
            }
            return false
        }
    );

    if (matchingContent) {
        console.log(
            'Content found in manifest',
            matchingContent,
        );
        return {
            type: "content",
            name: manifest.name,
            baseurl: manifest.baseurl,
            version: manifest.version,
            content: matchingContent,

        };
    }

    console.log('Content not found in manifest');
    return { type: "notFound" };
}
