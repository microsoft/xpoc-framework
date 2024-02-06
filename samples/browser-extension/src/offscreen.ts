// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { lookupXpocUri } from './xpoc-lib.js';

console.log('offscreen.js loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // if (request?.type === 'parseHtml') {
    //     fetch(request.url)
    //         .then((res) => {
    //             return res.text();
    //         })
    //         .then((html) => {
    //             const parser = new DOMParser();
    //             const doc = parser.parseFromString(html, 'text/html');
    //             const node = doc.querySelector(request.query);
    //             const result = node?.getAttribute(request.attribute);
    //             sendResponse({ result });
    //         })
    //         .catch((err) => {
    //             console.error(err);
    //         });
    // }

    if (request?.type === 'lookupXpocUri') {
        lookupXpocUri(request.tabUrl, request.url).then((result) => {
            sendResponse(result);
        });
    }

    return true; // true = async response
});
