// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

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
});

function getBaseURL(url) {
    const urlObj = new URL(url);
    let searchParams = urlObj.searchParams;
    let queryParams = [];
    if (urlObj.hostname.includes('youtube') && searchParams.has('v')) {
        queryParams.push('v=' + searchParams.get('v'));
    }
    const queryParamsString =
        queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    const baseURL = (urlObj.origin + urlObj.pathname + queryParamsString)
        .replace(/\/$/, '')
        .toLowerCase();
    return baseURL;
}

// compare two URLs for fuzzy equality
function fuzzyCompareUrl(url1, url2) {
    // remove trailing "/" and "/about" from URLs (some platforms account have 
    // an "about" page where XPOC URI could live)
    // TODO: could ignore case for part of the URL (some platforms have case-sensitive PUIDs)
    // and other well-known query params
    const cleanUrl = (url) => url.replace(/\/$/, "").replace(/\/about$/, "");
    return cleanUrl(url1) == cleanUrl(url2);
}

// listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'verifyXpocUri') {
        console.log('verifyXpocUri clicked');
        console.log(`clickedText: ${clickedText}`);
        const targetURL =
            clickedText
                // replace the xpoc:// prefix with https://
                .replace(/^xpoc:\/\//, 'https://')
                // remove trailing !
                .replace(/!$/, '')
                // remove trailing slash, if present
                .replace(/\/$/, '') +
            // append the XPOC manifest path
            '/xpoc-manifest.json';
        console.log(`Fetching "${targetURL}"`);
        fetch(targetURL)
            .then((response) => response.json())
            .then((manifest) => {
                console.log(manifest);
                const url = getBaseURL(tab.url);
                console.log('url', url);
                // check if the current tab's URL is listed in the manifest's account
                const matchingAccount = manifest.accounts.find(
                    (account) => fuzzyCompareUrl(getBaseURL(account.url), url)
                );
                if (matchingAccount) {
                    console.log('Content found in manifest', matchingAccount);
                    const result = {
                        name: manifest.name,
                        baseurl: manifest.baseurl,
                        version: manifest.version,
                        account: matchingAccount,
                    };
                    console.log('Result', result);
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'displayXpocAccount',
                        result: result,
                    });
                } else {
                    // if not, check if the current tab's URL is listed in the manifest's content
                    const matchingContent = manifest.content.find(
                        (content) => fuzzyCompareUrl(getBaseURL(content.url), url)
                    );
                    if (matchingContent) {
                        console.log(
                            'Content found in manifest',
                            matchingContent,
                        );
                        const result = {
                            name: manifest.name,
                            baseurl: manifest.baseurl,
                            version: manifest.version,
                            content: matchingContent,
                        };
                        console.log('Result', result);
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'displayXpocContent',
                            result: result,
                        });
                    } else {
                        console.log('Content not found in manifest');
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'xpocNotFound',
                        });
                    }
                }
            })
            .catch((error) => {
                console.error('Error fetching manifest:', error);
            });
    }
});
