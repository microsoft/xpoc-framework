// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type lookupXpocUriResult } from './xpoc-lib';

type lookupXpocUriMessage = {
    type: 'lookupXpocUri';
    url: string;
    tabUrl: string;
};

type lookupTrustUriMessage = {
    type: 'lookupTrustUri';
    url: string;
    tabUrl: string;
};

/*
  Create the offscreen document when the background script is loaded.  
  When background.js is a service worker (Chrome w/ Manifest V3), the offscreen document 
  is created when the service worker is started.
  A DOM is not available in the background service worker, so the offscreen document is created
    to parse HTML.
*/
chrome.offscreen.hasDocument().then((hasDocument) => {
    if (hasDocument) {
        return;
    }
    chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: 'Private DOM access to parse HTML',
    });
});

/**
 * Sends a message to the background script using the Chrome runtime API.
 * @param message The message to send.
 * @returns A promise that resolves to the result of the message.
 */
async function offscreenMessage<T, R>(message: T): Promise<R> {
    const result: R = await chrome.runtime.sendMessage(message);
    return result;
}

/**
 * Looks up the XPoc URI for a given tab URL and XPoc URL.
 * @param tabUrl The URL of the tab.
 * @param xpocUrl The URL of the XPoc.
 * @returns A promise that resolves to the result of the lookup.
 */
export async function lookupXpocUri(
    tabUrl: string,
    xpocUrl: string,
): Promise<lookupXpocUriResult> {
    return await offscreenMessage<lookupXpocUriMessage, lookupXpocUriResult>({
        type: 'lookupXpocUri',
        url: xpocUrl,
        tabUrl: tabUrl,
    });
}

/**
 * Looks up the trust.txt URI for a given tab URL and trust.txt URL.
 * @param tabUrl The URL of the tab.
 * @param trustUrl The URL of the trust.txt.
 * @returns A promise that resolves to the result of the lookup.
 */
export async function lookupTrustUri(
    tabUrl: string,
    trustUrl: string,
): Promise<lookupXpocUriResult> {
    return await offscreenMessage<lookupTrustUriMessage, lookupXpocUriResult>({
        type: 'lookupTrustUri',
        url: trustUrl,
        tabUrl: tabUrl,
    });
}
