// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { getLocalStorage, setLocalStorage } from './storage.js';
import { lookupXpocUri, type lookupXpocUriResult } from './xpoc-lib.js'
import { getOriginInfo } from './origin.js'

// the text that was clicked by the user
let clickedText = '';

// create the context menu item
let menuItemId = chrome.contextMenus.create({
    id: 'verifyXpocUri',
    title: 'Verify XPOC link',
    contexts: ['all'],
    documentUrlPatterns: ['<all_urls>'], // this ensures it will show on all pages
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // create context menu item, only if what is clicked is a valid XPOC link
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

// update the icon when the active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
    // activeInfo.tabId will give you the ID of the newly activated tab
    console.log(`Tab ${activeInfo.tabId} was activated`)
    // display the default icon first
    updateActionIcon('icons/unknown128x128.png')
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        console.log(`The active tab's URL is ${tab.url}`);
        // check if we have a result XPOC for this url
        getLocalStorage('xpocResults').then((storageObj) => {
            const currentTabUrl = tab.url as string
            if (storageObj.xpocResults[currentTabUrl]) {
                console.log(`Found results for ${currentTabUrl}`)
                // we already have a result for this url, so update the icon
                const xpocResult = storageObj.xpocResults[currentTabUrl] as { [xpocUri: string]: lookupXpocUriResult }
                console.log(`xpocResult: ${JSON.stringify(xpocResult)}`)
                const type = xpocResult[Object.keys(xpocResult)[0]].type
                if (type === 'account' || type === 'content') {
                    updateActionIcon('icons/valid128x128.png')
                } else if (type === 'notFound' || type === 'error' ) {
                    updateActionIcon('icons/invalid128x128.png')
                }
            }
        })
        // check if we have origin info for this url
        const info = getOriginInfo(tab.url)
        if (info) {
            console.log(`Found origin info for  ${tab.url}`)
            updateActionIcon('icons/valid128x128.png')
        }
    })
})

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
    console.log(`storing xpoc result for ${url} and ${xpocUri}`)
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
