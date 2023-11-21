// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { getLocalStorage, setLocalStorage } from './storage.js';
import { lookupXpocUri, type lookupXpocUriResult } from './xpoc-lib.js'

// the text that was clicked by the user
let clickedText = '';

// Create the context menu item
let menuItemId = chrome.contextMenus.create({
    id: 'verifyXpocUri',
    title: 'Verify XPOC link',
    contexts: ['all'],
    documentUrlPatterns: ['<all_urls>'], // this ensures it will show on all pages
});

// create context menu item, only if what is clicked is a valid XPOC link
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'showContextMenu') {
        clickedText = message.data;
        chrome.contextMenus.update(menuItemId, {
            visible: clickedText != null,
        });
    }
    if (message.action === 'lookupXpocUri') {
        const xpocUri = message.xpocUri;
        const tabUrl = (sender.tab as chrome.tabs.Tab).url as string
        lookupXpocUri(sender.tab?.url as string, xpocUri).then((result) => {
            storeXpocResult(tabUrl as string, clickedText, result);
            sendResponse(result);
        })
    }
    return true
});

// listen for context menu clicks
chrome.contextMenus.onClicked.addListener(
    async (info, tab) => {
        if (info.menuItemId === 'verifyXpocUri') {
            const tabUrl = (tab as chrome.tabs.Tab).url as string
            const tabId = (tab as chrome.tabs.Tab).id as number
            const result = await lookupXpocUri(tabUrl, clickedText)
            switch (result.type) {
                case 'account':
                    chrome.tabs.sendMessage(tabId, {
                        action: 'displayXpocAccount',
                        result: result,
                    });
                    await storeXpocResult(tabUrl as string, clickedText, result);
                    break;
                case 'content':
                    chrome.tabs.sendMessage(tabId, {
                        action: 'displayXpocContent',
                        result: result,
                    });
                    await storeXpocResult(tabUrl as string, clickedText, result);
                    break;
                case 'notFound':
                case 'error':
                    chrome.tabs.sendMessage(tabId, {
                        action: 'xpocNotFound',
                    });
                    break;

            }
        }
    }
);

export type xpocResultSet = {
    [url: string]: {
        [xpocUri: string]: lookupXpocUriResult
    }
}

async function storeXpocResult(url: string, xpocUri: string, result: lookupXpocUriResult): Promise<void> {
    let xpocResultsSet = await getLocalStorage('xpocResults') as { xpocResults : xpocResultSet}
    xpocResultsSet.xpocResults[url] = xpocResultsSet.xpocResults[url] || {}
    xpocResultsSet.xpocResults[url][xpocUri] = result
    await setLocalStorage(xpocResultsSet);
}
