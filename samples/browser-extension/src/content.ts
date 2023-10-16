// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UwaContentPopup } from "./control";

const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayXpocAccount') {
        if (request.result) {
            uwaContentPopup.show(
                lastContextMenuTarget as HTMLElement,
                'XPOC Information',
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    'Origin information',
                    { label: 'Name', value: request.result.name },
                    {
                        label: 'Website',
                        link: `<a href='https://${request.result.baseurl}' target='_blank'>${request.result.baseurl}<a/>`,
                    },
                ],
                [
                    'Account information',
                    {
                        label: 'URL',
                        link: `<a href='${request.result.account.url}' target='_blank'>${request.result.account.url}<a/>`,
                    },
                    { label: 'Account', value: request.result.account.account },
                ],
            );
        }
    }
    if (request.action === 'displayXpocContent') {
        if (request.result) {
            uwaContentPopup.show(
                lastContextMenuTarget as HTMLElement,
                'XPOC Information',
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    'Origin information',
                    { label: 'Name', value: request.result.name },
                    { label: 'Website', value: request.result.baseurl },
                ],
                [
                    'Content information',
                    { label: 'Description', value: request.result.content.desc },
                    { label: 'URL', value: request.result.content.url },
                    { label: 'PUID', value: request.result.content.puid },
                    { label: 'Account', value: request.result.content.account },
                    { label: 'Timestamp', value: request.result.content.timestamp },
                ],
            );
        }
    }
    if (request.action === 'xpocNotFound') {
        alert('Page not found in XPOC manifest');
    }
});

/*
    When we right-click on a node, we save a reference to it
    When the background script responds to the context menu click,
    we'll know what node we right-clicked on
*/
let lastContextMenuTarget: HTMLElement | undefined = undefined;

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
                lastContextMenuTarget = target;
            }
            chrome.runtime.sendMessage({
                action: 'showContextMenu',
                data: clickedText,
            });
        }
    },
    true,
);

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

const uwaContentPopup = new UwaContentPopup();
