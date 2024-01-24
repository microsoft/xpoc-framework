// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ContentPopup } from "./control";
import { Icon } from "./icon";
import DomScanner from "./scanner";
import { type lookupXpocUriResult } from "./xpoc-lib";
import { contextMenuResult, contextTarget } from "./context";


const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;


contextMenuResult((result: unknown) => {
    addIcon(contextTarget as Node);
    showXpocPopup(contextTarget as Node, result as lookupXpocUriResult)

});

/*
    Listen for messages from background.js
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === 'autoScanUpdated') {
        if (request.autoScan) {
            scanner.start();
        } else {
            scanner.stop();
        }
    }

});



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

// returns a base URL from a XPOC URI
const getBaseURL = (xpocUri: string): string =>
    xpocUri.replace(/^xpoc:\/\//, 'https://').replace(/!$/, '').replace(/\/$/, '')

// keep a cache of nodes we've already processed
const cache = new WeakMap<Node, string>()
const skipHiddenNodes = false

// auto-validate XPOC URIs (if enabled)
chrome.storage.local.get(['autoVerifyXpocUris'], (result) => {
    const autoValidateXpocUris = !!result?.autoVerifyXpocUris;
    if (autoValidateXpocUris) {
        scanner.start();
    }
})


const addIcon = (node: Node) => {
    console.log(`add: ${node.textContent}`);

    // We can choose to bypass nodes that are initially hidden. However, there's a complication if a node that 
    // starts off hidden later becomes visible. In such cases, re-scanning the node when it becomes visible is a 
    // challenging task to detect. Therefore, for the time being, we will scan all nodes.
    if ((node as Text).textContent !== '') {

        const parentElement = node.parentNode as HTMLElement
        if (skipHiddenNodes && isStyleVisible(parentElement) === false) {
            return
        }

        const match = PATTERN.exec((node as Text).textContent ?? '')
        const xpocUri = match?.[0] as string
        cache.set(node, xpocUri)

        lookupXpocUri(xpocUri)
            .then((result) => {
                const icon = new Icon(node, xpocUri, result)
                icon.onClick = () => {
                    const xpocResult = result as lookupXpocUriResult
                    showXpocPopup(icon.img as HTMLElement, xpocResult);
                }
                console.log(`result: ${JSON.stringify(result)}`);
            })
    }

}

const SUCCESS_COLOR = '#5B9BD5';
const ERROR_COLOR = '#E43A19';

function showXpocPopup(tagetNode: Node, xpocResult: lookupXpocUriResult) {

    if (xpocResult.type === 'notFound') {
        contentPopup.show(
            tagetNode as HTMLElement,
            'XPOC Error',
            ERROR_COLOR,
            chrome.runtime.getURL('icons/invalid.svg'),
            [
                {
                    title: 'Error',
                    'Message': `This page is not listed in the manifest at ${getBaseURL(xpocResult.baseurl)}`
                },
            ],
        );
    }

    if (xpocResult.type === 'error') {
        contentPopup.show(
            tagetNode as HTMLElement,
            'XPOC Error',
            ERROR_COLOR,
            chrome.runtime.getURL('icons/invalid.svg'),
            [
                {
                    title: 'Error',
                    'Message': `Failed to fetch manifest from ${getBaseURL(xpocResult.baseurl)}`
                },
            ],
        );
    }

    if (xpocResult.type === 'content') {
        contentPopup.show(
            tagetNode as HTMLElement,
            'XPOC Information',
            SUCCESS_COLOR,
            chrome.runtime.getURL('icons/xpoc_logo.svg'),
            [
                {
                    title: 'Origin',
                    'Name': xpocResult.name,
                    'Website': `<a href='https://${xpocResult.baseurl}' target='_blank'>${xpocResult.baseurl}</a>`,
                },
                {
                    title: 'Content',
                    'Description': xpocResult.content.desc ?? '',
                    'URL': `<a href='https://${xpocResult.content.url}' target='_blank'>${xpocResult.content.url}</a>`,
                    'PUID': xpocResult.content.puid ?? '',
                    'Account': xpocResult.content.account,
                    'Timestamp': xpocResult.content.timestamp ?? '',
                }
            ],
        );
    }

    if (xpocResult.type === 'account') {
        contentPopup.show(
            tagetNode as HTMLElement,
            'XPOC Information',
            SUCCESS_COLOR,
            chrome.runtime.getURL('icons/xpoc_logo.svg'),
            [
                {
                    title: 'Origin',
                    'Name': xpocResult.name,
                    'Website': `<a href='https://${xpocResult.baseurl}' target='_blank'>${xpocResult.baseurl}</a>`,
                },
                {
                    title: 'Account',
                    'URL': `<a href='${xpocResult.account.url}' target='_blank'>${xpocResult.account.url}</a>`,
                    'Account': xpocResult.account.account,
                }
            ],
        );
    }
}


function nodeTest(node: Node): boolean {
    if (node.textContent == null || node.nodeName === 'SCRIPT' || node?.parentElement?.nodeName === 'SCRIPT') {
        return false;
    }
    return PATTERN.test(node.textContent)
}


function addCallback(node: Node): void {
    console.log(`Scanner2: add: ${node.textContent}`);
    addIcon(node);
}


function removeCallback(node: Node): void {
    console.log(`Scanner2: remove: ${node.textContent}`);
    if ((node as HTMLElement).nodeName === 'IMG' && (node as HTMLElement).hasAttribute('xpoc')) {
        console.log(`remove: ${node as HTMLElement}`);
        // cache.delete(parent.node[0] as Node);
        // addIcon(parent.node[0] as Node);
    }
}

const scanner = new DomScanner(nodeTest, addCallback, removeCallback);

/**
 * Determines if an element is visually rendered in the document.
 * Checks if the element is part of the document and if its computed style
 * makes it visually perceivable (not `display: none`, `visibility: hidden`, or `opacity: 0`).
 * Also checks if the element has non-zero dimensions.
 * @param {Element} element - The DOM element to check.
 * @returns {boolean} - Returns `true` if the element is visually rendered, otherwise `false`.
 */
function isStyleVisible(element: Element): boolean {
    if (!document.body.contains(element)) {
        return false;
    }
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return !(style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || rect.width === 0 || rect.height === 0);
}
