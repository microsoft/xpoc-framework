// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ContentPopup } from "./control";
import { Icon } from "./icon";
import { scanner } from "./scanner";
import { type lookupXpocUriResult } from "./xpoc-lib";

const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayXpocAccount') {
        if (request.result) {
            contentPopup.show(
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
            contentPopup.show(
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

const contentPopup = new ContentPopup();

/**
 * Call background to lookup the xpocUri
 *
 * @param {string} xpocUri
 * @returns Promise<lookupXpocUriResult>
 */
const lookupXpocUri = async (xpocUri: string): Promise<lookupXpocUriResult> => {
    return await new Promise((resolve, reject): void => {
        chrome.runtime.sendMessage({ action: 'lookupXpocUri', xpocUri }, (result) => {
            resolve(result)
        })
    })
}

// keep a cache of nodes we've already processed
const cache = new WeakMap<Node, string>()


scanner.start(
    (node: Node) => {
        console.log(`add: ${node.textContent}`);

        // skip if the node is empty or hidden
        // TODO: a node can be initialliy hidden, but then become visible later
        if (!cache.has(node) && (node as Text).textContent !== '' && (node.parentNode as HTMLElement).offsetWidth !== 0) {
            const match = PATTERN.exec((node as Text).textContent ?? '')
            const xpocUri = match?.[0] as string
            cache.set(node, xpocUri)

            lookupXpocUri(xpocUri)
                .then((result) => {
                    const icon = new Icon(node, xpocUri, result)
                    icon.onClick = () => {
                        const xpocResult = result as lookupXpocUriResult
                        if (xpocResult.type === 'content') {
                            contentPopup.show(
                                icon.img as HTMLElement,
                                'XPOC Information',
                                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                                [
                                    'Origin information',
                                    { label: 'Name', value: xpocResult.name },
                                    { label: 'Website', value: xpocResult.baseurl },
                                ],
                                [
                                    'Content information',
                                    { label: 'Description', value: xpocResult.content.desc },
                                    { label: 'URL', value: xpocResult.content.url },
                                    { label: 'PUID', value: xpocResult.content.puid },
                                    { label: 'Account', value: xpocResult.content.account },
                                    { label: 'Timestamp', value: xpocResult.content.timestamp },
                                ],
                            );
                        }
                        if (xpocResult.type === 'account') {
                            contentPopup.show(
                                icon.img as HTMLElement,
                                'XPOC Information',
                                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                                [
                                    'Origin information',
                                    { label: 'Name', value: xpocResult.name },
                                    {
                                        label: 'Website',
                                        link: `<a href='https://${xpocResult.baseurl}' target='_blank'>${xpocResult.baseurl}<a/>`,
                                    },
                                ],
                                [
                                    'Account information',
                                    {
                                        label: 'URL',
                                        link: `<a href='${xpocResult.account.url}' target='_blank'>${xpocResult.account.url}<a/>`,
                                    },
                                    { label: 'Account', value: xpocResult.account.account },
                                ],
                            );
                        }
                        if (xpocResult.type === 'notFound') {
                            contentPopup.show(
                                icon.img as HTMLElement,
                                `Manifest/content not found at ${xpocUri}`,
                                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                            );
                        }
                        if (xpocResult.type === 'error') {
                            contentPopup.show(
                                icon.img as HTMLElement,
                                'XPOC Error',
                                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                                [
                                    'Error',
                                    { label: 'Message', value: `Failed to download or parse manifest at ${xpocUri}` }
                                ],
                            );
                        }
                    }
                    console.log(`result: ${JSON.stringify(result)}`);
                })
        }

    },
    (result) => {
        // TODO: remove the icon if the node is no longer in the DOM
    }
)

