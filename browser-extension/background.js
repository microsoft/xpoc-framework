// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// the text that was clicked by the user
let clickedText = '';

// create context menu item, only if what is clicked is a valid XPOC link
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'showContextMenu') {
        console.log(`showContextMenu action triggered. message.href: "${message.href}"`);
        clickedText = message.href;
        console.log(`clickedText: "${clickedText}"`)

        chrome.contextMenus.removeAll(function() {
            chrome.contextMenus.create({
                id: "verifyXpocUri",
                title: "Verify XPOC content",
                contexts: ["all"],
                documentUrlPatterns: ["<all_urls>"] // this ensures it will show on all pages
            });
        });
    }

    if (message.action === 'hideContextMenu') {
        console.log(`hideContextMenu action triggered`);
        chrome.contextMenus.removeAll();
    }
});

function getBaseURL(url) {
    const urlObj = new URL(url);
    let searchParams = urlObj.searchParams;
    let queryParams = [];
    if(urlObj.hostname.includes('youtube') && searchParams.has('v')) {
        queryParams.push('v=' + searchParams.get('v'));
    }
    const queryParamsString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    const baseURL = (urlObj.origin + urlObj.pathname + queryParamsString).replace(/\/$/, '').toLowerCase();
    return baseURL;
}
  
// listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'verifyXpocUri') {
        console.log('verifyXpocUri clicked');
        console.log(`clickedText: ${clickedText}`);
        const targetURL = clickedText
            // replace the xpoc:// prefix with https://
            .replace(/^xpoc:\/\//, 'https://')
            // remove trailing slash
            .replace(/\/$/, "")
            // append the XPOC manifest path
            + '/.well-known/xpoc-manifest.json';
        console.log(`Fetching "${targetURL}"`);
        fetch(targetURL)
          .then(response => response.json())
          .then(manifest => {
            console.log(manifest);
            const url = getBaseURL(tab.url);
            console.log('url', url);
            const matchingContent = manifest.content.find(content => getBaseURL(content.url).toLowerCase() === url);
            if (matchingContent) {
                console.log('Content found in manifest', matchingContent);
                const result = {
                    name: manifest.name,
                    url: manifest.url,
                    content: matchingContent
                };
                console.log('Result', result);
                chrome.tabs.sendMessage(tab.id, { action: 'displayXpocContent', result: result });
            } else {
                console.log('Content not found in manifest');
                chrome.tabs.sendMessage(tab.id, { action: 'xpocNotFound'});
            }
          })
          .catch(error => {
            console.error("Error fetching manifest:", error);
          });
    }
})
