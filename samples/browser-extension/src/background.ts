// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { getLocalStorage, setLocalStorage } from './storage.js';
import { lookupXpocUri, lookupTrustUri, type lookupXpocUriResult } from './xpoc-lib.js';
import { contextMenuRequest, clickedText } from './context.js';
import { getOriginInfo } from './origin.js';

/*
    Represents a result set for XPOC uri lookup
*/
export type xpocResultSet = {
    [url: string]: {
        [xpocUri: string]: lookupXpocUriResult;
    };
};

/*
    Runs only when the extension is installed for the first time.
*/
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        chrome.storage.local.set({ autoVerifyXpocUris: true });
    }
});

/*
    Listens for request from content script to lookup XPOC URI.
*/
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'lookupXpocUri') {
        console.log('Background: message = lookupXpocUri');
        const xpocUri = message.xpocUri;
        const tabUrl = (sender.tab as chrome.tabs.Tab).url as string;
        lookupXpocUri(sender.tab?.url as string, xpocUri).then((result) => {
            storeXpocResult(tabUrl as string, clickedText, result);
            sendResponse(result);
        });
    } else if (message.action === 'lookupTrustUri') {
        console.log('Background: message = lookupTrustUri');
        const trustUri = message.trustUri;
        const tabUrl = (sender.tab as chrome.tabs.Tab).url as string;
        lookupTrustUri(sender.tab?.url as string, trustUri).then((result) => {
            storeXpocResult(tabUrl as string, clickedText, result);
            sendResponse(result);
        });
    }
    return true;
});

/* 
    The `contextMenuRequest` function is a callback function that is executed when a context menu item
    is clicked. 
*/
contextMenuRequest(async (info, clickedText, tab) => {
    if (info.menuItemId === 'verifyXpocUri') {
        const tabUrl = (tab as chrome.tabs.Tab).url as string;
        const xpocUrl = clickedText;
        const result = await lookupXpocUri(tabUrl, xpocUrl); // TODO: FIXME: add Trust.txt lookup too
        if (result.type === 'account' || result.type === 'content') {
            await storeXpocResult(tabUrl as string, xpocUrl, result);
        } else {
            // TODO: clear the result from storage
        }
        return result;
    }
});

/* 
   Event listener triggered when a tab is activated in the browser. 
*/
chrome.tabs.onActivated.addListener((activeInfo) => {
    // activeInfo.tabId will give you the ID of the newly activated tab
    console.log(`Tab ${activeInfo.tabId} was activated`);
    // display the default icon first
    updateActionIcon('icons/unknown128x128.png');
    // You can retrieve more information about the tab using chrome.tabs.get
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log(`The active tab's URL is ${tab.url}`);
        // check if we have a result XPOC for this url
        getLocalStorage('xpocResults').then((storageObj) => {
            const currentTabUrl = tab.url as string;
            if (storageObj.xpocResults[currentTabUrl]) {
                console.log(`Found results for ${currentTabUrl}`);
                // we already have a result for this url, so update the icon
                const xpocResult = storageObj.xpocResults[currentTabUrl] as {
                    [xpocUri: string]: lookupXpocUriResult;
                };
                console.log(`xpocResult: ${JSON.stringify(xpocResult)}`);
                const type = xpocResult[Object.keys(xpocResult)[0]].type;
                if (type === 'account' || type === 'content') {
                    updateActionIcon('icons/valid128x128.png');
                } else if (type === 'notFound' || type === 'error') {
                    updateActionIcon('icons/invalid128x128.png');
                }
            }
        });
        // check if we have origin info for this url
        const info = getOriginInfo(tab.url);
        if (info) {
            console.log(`Found origin info for  ${tab.url}`);
            updateActionIcon('icons/valid128x128.png');
        }
    });
});

/**
 * Updates the action icon with the image located at the specified path.
 * @param path - The path to the image.
 * @returns A promise that resolves once the action icon is updated.
 */
async function updateActionIcon(path: string) {
    // code below from the Chrome Extension samples
    // There are easier ways for a page to extract an image's imageData, but the approach used here
    // works in both extension pages and service workers.
    const response = await fetch(chrome.runtime.getURL(path));
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    const osc = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = osc.getContext('2d');
    ctx?.drawImage(imageBitmap, 0, 0);
    const imageData = ctx?.getImageData(0, 0, osc.width, osc.height);
    chrome.action.setIcon({ imageData });
}

/**
 * Stores the XPoc result for a given URL and XPoc URI.
 *
 * @param url - The URL for which the XPoc result is being stored.
 * @param xpocUri - The XPoc URI for which the XPoc result is being stored.
 * @param result - The XPoc result to be stored.
 * @returns A Promise that resolves when the XPoc result is stored.
 */
async function storeXpocResult(
    url: string,
    xpocUri: string,
    result: lookupXpocUriResult,
): Promise<void> {
    console.log(`storing xpoc result for ${url} and ${xpocUri}`);
    // update the toolbar icon
    console.log(`xpoc result: ${result.type}`);
    if (result.type === 'error' || result.type === 'notFound') {
        // "notFound" in manifest is also an error
        await updateActionIcon('icons/invalid128x128.png');
    } else {
        await updateActionIcon('icons/valid128x128.png');
    }
    // store the result
    const xpocResultsSet = (await getLocalStorage('xpocResults')) as {
        xpocResults: xpocResultSet;
    };
    xpocResultsSet.xpocResults[url] = xpocResultsSet.xpocResults[url] || {};
    xpocResultsSet.xpocResults[url][xpocUri] = result;
    await setLocalStorage(xpocResultsSet);
}
