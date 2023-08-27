// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

document.addEventListener('contextmenu', function(event) {
    const lastContextMenuTarget = event.target;
    console.log(`contextmenu event fired. lastContextMenuTarget`, lastContextMenuTarget);

    // XPOC URI regex
    const regex = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/g;

    // extract URI from innerHTML
    console.log(`lastContextMenuTarget.innerHTML: "${lastContextMenuTarget.innerHTML}"`);
    const targetString = lastContextMenuTarget.innerHTML;
    console.log(`targetString: "${targetString}"`);

    const match = regex.exec(targetString);
    if (match) {
        const xpocUri = match[0];
        console.log("Found a valid xpoc link:", xpocUri);
        chrome.runtime.sendMessage({action: "showContextMenu", href: xpocUri});
    } else {
        console.log("Target does not contain a valid xpoc link");
        chrome.runtime.sendMessage({action: "hideContextMenu"});
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // TODO: don't use a alert popup
    if (request.action === 'displayXpocAccount') {
        if (request.result) {
            const result = 
                "XPOC Information\n" +
                "\n" +
                "Origin information\n" +
                "  Name: " + request.result.name + "\n" +
                "  Website: " + request.result.hostname + "\n" +
                "\n" +
                "Account information\n" +
                "  URL: " + request.result.account.url + "\n" +
                "  Account: " + request.result.account.account + "\n";
            alert(result);
        }
    }
    if (request.action === 'displayXpocContent') {
        if (request.result) {
            const result = 
                "XPOC Information\n" +
                "\n" +
                "Origin information\n" +
                "  Name: " + request.result.name + "\n" +
                "  Website: " + request.result.hostname + "\n" +
                "\n" +
                "Content information\n" +
                "  Title: " + request.result.content.title + "\n" +
                "  URL: " + request.result.content.url + "\n" +
                "  PUID: " + request.result.content.puid + "\n" +
                "  Account: " + request.result.content.account + "\n" +
                "  Timestamp: " + request.result.content.timestamp + "\n";
            alert(result);
        }
    }
    if (request.action === 'xpocNotFound') {
        alert('Page not found in XPOC manifest');
    }
})
