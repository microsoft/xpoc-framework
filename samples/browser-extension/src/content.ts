// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ContentPopup } from './control';
import { Icon } from './icon';
import DomScanner from './scanner';
import { type lookupXpocUriResult } from './xpoc-lib';
import { contextMenuResult, contextTarget } from './context';

const XPOC_PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;
const TRUSTTXT_PATTERN = /trust:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;
const skipHiddenNodes = false;
const SUCCESS_COLOR = '#5B9BD5';
const ERROR_COLOR = '#E43A19';

/*
    Instantiate the DomScanner and popup control
*/
const scanner = new DomScanner(nodeTest, addCallback, removeCallback);
const contentPopup = new ContentPopup();

/* 
    Called after background.js has processed the context menu click
    Context menu clicks are captured and handled in the background.js
*/
contextMenuResult((result: unknown) => {
    addIcon(contextTarget as Node);
    showXpocPopup(contextTarget as Node, result as lookupXpocUriResult);
});

/*
    Listen for messages from background.js
*/
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'autoScanUpdated') {
        request.autoScan ? scanner.start() : scanner.stop();
    }
});

/**
 * Call background to lookup the xpocUri
 *
 * @param {string} xpocUri
 * @returns Promise<lookupXpocUriResult>
 */
const lookupXpocUri = async (xpocUri: string): Promise<lookupXpocUriResult> => {
    return await new Promise((resolve): void => {
        chrome.runtime.sendMessage(
            { action: 'lookupXpocUri', xpocUri },
            (result) => {
                resolve(result);
            },
        );
    });
};

/**
 * Call background to lookup the trustUri
 *
 * @param {string} trustUri
 * @returns Promise<lookupXpocUriResult>
 */
const lookupTrustUri = async (trustUri: string): Promise<lookupXpocUriResult> => {
    return await new Promise((resolve): void => {
        chrome.runtime.sendMessage(
            { action: 'lookupTrustUri', trustUri },
            (result) => {
                resolve(result);
            },
        );
    });
};

/**
 * Converts an xpoc URI to a base URL.
 * @param xpocUri - The xpoc URI to convert.
 * @returns The base URL.
 */
const getBaseURL = (xpocUri: string): string =>
    xpocUri
        .replace(/^xpoc:\/\//, 'https://')
        .replace(/^trust:\/\//, 'https://')
        .replace(/!$/, '')
        .replace(/\/$/, '');

/**
 * The function `autoScanPage` checks if a certain flag is set in the local storage and starts a
 * scanner if the flag is true.
 */
(function autoScanPage() {
    chrome.storage.local.get(['autoVerifyXpocUris'], (result) => {
        const autoValidateXpocUris = !!result?.autoVerifyXpocUris;
        if (autoValidateXpocUris) {
            scanner.start();
        }
    });
})();

/**
 * Adds an icon to the specified node.
 *
 * @param node - The node to add the icon to.
 */
const addIcon = (node: Node) => {
    console.log(`add: ${node.textContent}`);

    // We can choose to bypass nodes that are initially hidden. However, there's a complication if a node that
    // starts off hidden later becomes visible. In such cases, re-scanning the node when it becomes visible is a
    // challenging task to detect. Therefore, for the time being, we will scan all nodes.
    if ((node as Text).textContent !== '') {
        const parentElement = node.parentNode as HTMLElement;
        if (skipHiddenNodes && isStyleVisible(parentElement) === false) {
            return;
        }

        // Check if the node contains an XPOC URI
        const match = XPOC_PATTERN.exec((node as Text).textContent ?? '');
        const xpocUri = match?.[0] as string;

        lookupXpocUri(xpocUri).then((result) => {
            const icon = new Icon(node, xpocUri, result);
            icon.onClick = () => {
                const xpocResult = result as lookupXpocUriResult;
                showXpocPopup(icon.img as HTMLElement, xpocResult);
            };
            console.log(`result: ${JSON.stringify(result)}`);
        });

        // Check if the node contains a Trust.txt URI
        const trustMatch = TRUSTTXT_PATTERN.exec((node as Text).textContent ?? '');
        const trustUri = trustMatch?.[0] as string;

        lookupTrustUri(trustUri).then((result) => {
            const icon = new Icon(node, trustUri, result);
            icon.onClick = () => {
                const xpocResult = result as lookupXpocUriResult;
                showXpocPopup(icon.img as HTMLElement, xpocResult);
            };
            console.log(`result: ${JSON.stringify(result)}`);
        });
    }
};

/**
 * Displays the XPOC popup based on the provided xpocResult.
 *
 * @param {Node} targetNode - The target node where the popup will be displayed.
 * @param {lookupXpocUriResult} xpocResult - The result of the XPOC lookup.
 */
function showXpocPopup(targetNode: Node, xpocResult: lookupXpocUriResult) {
    if (xpocResult.type === 'notFound') {
        contentPopup.show(
            targetNode as HTMLElement,
            'XPOC Error',
            ERROR_COLOR,
            chrome.runtime.getURL('icons/invalid.svg'),
            [
                {
                    title: 'Error',
                    Message: `This page is not listed in the manifest at ${getBaseURL(
                        xpocResult.baseurl,
                    )}`,
                },
            ],
        );
    }

    if (xpocResult.type === 'error') {
        contentPopup.show(
            targetNode as HTMLElement,
            'XPOC Error',
            ERROR_COLOR,
            chrome.runtime.getURL('icons/invalid.svg'),
            [
                {
                    title: 'Error',
                    Message: `Failed to fetch manifest from ${getBaseURL(
                        xpocResult.baseurl,
                    )}`,
                },
            ],
        );
    }

    if (xpocResult.type === 'content') {
        contentPopup.show(
            targetNode as HTMLElement,
            'XPOC Information',
            SUCCESS_COLOR,
            chrome.runtime.getURL('icons/xpoc_logo.svg'),
            [
                {
                    title: 'Origin',
                    Name: xpocResult.name,
                    Website: `<a href='https://${xpocResult.baseurl}' target='_blank'>${xpocResult.baseurl}</a>`,
                },
                {
                    title: 'Content',
                    Description: xpocResult.content.desc ?? '',
                    URL: `<a href='https://${xpocResult.content.url}' target='_blank'>${xpocResult.content.url}</a>`,
                    PUID: xpocResult.content.puid ?? '',
                    Account: xpocResult.content.account,
                    Timestamp: xpocResult.content.timestamp ?? '',
                },
            ],
        );
    }

    if (xpocResult.type === 'account') {
        if (xpocResult.version === 'trust.txt-draft00') {
            const platformMessage = xpocResult.account.platform ? `${xpocResult.account.platform} account ${xpocResult.account.account}` : `Account ${xpocResult.account.account}`;
            contentPopup.show(
                targetNode as HTMLElement,
                'Trust.txt match',
                SUCCESS_COLOR,
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    {
                        Message: `${platformMessage} found in trust.txt file at ${xpocResult.baseurl}`
                    }
                ],
            );
        } else {
            contentPopup.show(
                targetNode as HTMLElement,
                'XPOC Information',
                SUCCESS_COLOR,
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    {
                        title: 'Origin',
                        Name: xpocResult.name,
                        Website: `<a href='https://${xpocResult.baseurl}' target='_blank'>${xpocResult.baseurl}</a>`,
                    },
                    {
                        title: 'Account',
                        URL: `<a href='${xpocResult.account.url}' target='_blank'>${xpocResult.account.url}</a>`,
                        Account: xpocResult.account.account,
                    },
                ],
            );
        }
    }
}

function nodeTest(node: Node): boolean {
    if (
        node.textContent == null ||
        node.nodeName === 'SCRIPT' ||
        node?.parentElement?.nodeName === 'SCRIPT'
    ) {
        return false;
    }
    return XPOC_PATTERN.test(node.textContent) || TRUSTTXT_PATTERN.test(node.textContent);
}

function addCallback(node: Node): void {
    console.log(`Scanner2: add: ${node.textContent}`);
    addIcon(node);
}

function removeCallback(node: Node): void {
    console.log(`Scanner2: remove: ${node.textContent}`);
    if (
        (node as HTMLElement).nodeName === 'IMG' &&
        (node as HTMLElement).hasAttribute('xpoc')
    ) {
        console.log(`remove: ${node as HTMLElement}`);
        // cache.delete(parent.node[0] as Node);
        // addIcon(parent.node[0] as Node);
    }
}

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

    return !(
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity) === 0 ||
        rect.width === 0 ||
        rect.height === 0
    );
}
