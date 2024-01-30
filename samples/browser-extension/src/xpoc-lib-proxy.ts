// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type lookupXpocUriResult } from "./xpoc-lib";

/*
  Create the offscreen document when the background script is loaded.  
*/
chrome.offscreen.hasDocument().then((hasDocument) => {
    if (hasDocument) {
        return;
    }
    chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: 'Private DOM access to parse HTML',
    })
})


async function offscreenMessage<T, R>(message: T): Promise<R> {
    const result: R = await chrome.runtime.sendMessage(message)
    return result
}

type lookupXpocUriMessage = {
    type: 'lookupXpocUri'
    url: string
    tabUrl: string
}

export async function lookupXpocUri(tabUrl: string, xpocUrl: string): Promise<lookupXpocUriResult> {
    return await offscreenMessage<lookupXpocUriMessage, lookupXpocUriResult>({ type: 'lookupXpocUri', url: xpocUrl, tabUrl: tabUrl })
}
