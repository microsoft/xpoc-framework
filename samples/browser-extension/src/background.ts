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
    if (message.action === 'updateIcon') {
        updateActionIcon(message.path).then(() => {
            console.log(`Icon updated successfully: ${message.path}`)
        }).catch((error) => {
            console.error('Error updating icon:', error)
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

async function updateActionIcon(path: string) {
    // code below from the Chrome Extension samples
    // There are easier ways for a page to extract an image's imageData, but the approach used here
    // works in both extension pages and service workers.
    const response = await fetch(chrome.runtime.getURL(path))
    const blob = await response.blob()
    const imageBitmap = await createImageBitmap(blob)
    const osc = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    let ctx = osc.getContext('2d')
    ctx?.drawImage(imageBitmap, 0, 0)
    const imageData = ctx?.getImageData(0, 0, osc.width, osc.height)
    chrome.action.setIcon({ imageData })
}

async function storeXpocResult(url: string, xpocUri: string, result: lookupXpocUriResult): Promise<void> {
    // update the toolbar icon
    console.log(`xpoc result: ${result.type}`)
    if (result.type === 'error' || result.type === 'notFound') {
        // "notFound" in manifest is also an error
        await updateActionIcon('icons/invalid128x128.png')
    } else {
        await updateActionIcon('icons/valid128x128.png')
    }
    // store the result
    let xpocResultsSet = await getLocalStorage('xpocResults') as { xpocResults : xpocResultSet}
    xpocResultsSet.xpocResults[url] = xpocResultsSet.xpocResults[url] || {}
    xpocResultsSet.xpocResults[url][xpocUri] = result
    await setLocalStorage(xpocResultsSet)
}
