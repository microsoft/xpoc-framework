// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.


/* 

    Background script

*/

export let clickedText = '';

export function contextMenuRequest(handler: (info: chrome.contextMenus.OnClickData, clickedText: string, tab?: chrome.tabs.Tab) => Promise<unknown>) {

    // // the text that was clicked by the user
    // let clickedText = '';

    // create the context menu item
    let menuItemId = chrome.contextMenus.create({
        id: 'verifyXpocUri',
        title: 'Verify XPOC link',
        contexts: ['all'],
        documentUrlPatterns: ['<all_urls>'], // this ensures it will show on all pages
    });

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        /*
            When the user right clicks on text and it matches the regex for a valid XPOC link,
            the content script will send a message to the background script with the text that was clicked.
            The background script will then update the context menu to add the "Verify XPOC link" option.
        */
        if (message.action === 'showContextMenu') {
            clickedText = message.data;
            chrome.contextMenus.update(menuItemId, {
                visible: clickedText != null,
            });
        }

        return true
    });

    chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
        return handler(info, clickedText, tab)
            .then((result) => {
                const tabId = (tab as chrome.tabs.Tab).id as number
                chrome.tabs.sendMessage(tabId, {
                    action: 'contextMenuResult',
                    data: result,
                });
            })
    })

}

/* 


    Content script 


*/


const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;


/*
    When we right-click on a node, we save a reference to it
    When the background script responds to the context menu click,
    we'll know what node we right-clicked on 
*/
export let contextTarget: Node | undefined = undefined;

export function contextMenuResult(handler: (result: unknown) => void): void {

    /*
        Determines if specific word we right-clicked on is a valid XPOC URI
        We want to check if the text we clicked on is a valid XPOC URI before we show the XPOC context menu.
        The context menu will automatically show up if we right-click on some text.
        We have to send a message to background.js to show the XPOC option in the context menu.
        So there is a race:
        1. We right-click on some text and trigger an event
        2. We determine if the text is a valid XPOC URI
        3. We send a message to background.js to show the XPOC option in the context menu
        4. We have to do this before the context menu displays automatically
    
        The mouseup event happens early enough that we can send the message to background.js in time,
        but not too early where we don't have the selected text available in the event
    */
    document.addEventListener(
        'mouseup',
        function (event) {
            if (event.button === 2 /* right click */) {
                const target = event.target as HTMLElement;
                if (!target.textContent) return;
                const clickedText = getSubstringAtClick(
                    target.textContent,
                    PATTERN,
                    event,
                );
                if (clickedText) {
                    contextTarget = Array.from(target.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
                }
                chrome.runtime.sendMessage({
                    action: 'showContextMenu',
                    data: clickedText,
                });
            }
        },
        true,
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        /*
            If we right-click on a valid XPOC URI, we'll send a message to background.js validate the XPOC URI
            The response from background.js will be sent here
        */
        if (request.action === 'contextMenuResult') {
            handler(request.data)
        }


    });

}

/*
    This will determine if the specific word we click on, even if part of a larger string,
    matches the regex pattern.
    We're trying to only have the context menu show up if we click on an actual XPOC URI,
    and not just on a larger string that contains a XPOC URI
*/
function getSubstringAtClick(textContent: string, regex: RegExp, event: MouseEvent) {
    const selection = window.getSelection() as Selection;
    if (!selection.rangeCount) return undefined;

    const range = selection.getRangeAt(0);
    const clickIndex = range.startOffset;

    let match = textContent.match(regex);

    if (!match) return undefined;

    const startIndex = match.index as number;
    const endIndex = startIndex + match[0].length;

    // TODO: 
    // Firefox returns 0 for range.startOffset when you right-click on text
    // it seems to be using the previous left-click position, which may be somewhere else on the page entirely
    if (clickIndex === 0 || (clickIndex >= startIndex && clickIndex <= endIndex)) {
        return match[0];
    }

    return undefined;
}
