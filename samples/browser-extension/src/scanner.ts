// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;

let _addCallback: (node: Node) => void;
let _observer: MutationObserver;
let _started = false;

/**
 * Determines if a node should be processed.
 * Ignores non-text nodes, disconnected nodes, nodes inside SCRIPT elements,
 * and nodes not matching the specified pattern.
 * @param {Node} node - The Node to check.
 * @returns {boolean} - True if the node should be processed, false otherwise.
 */
function nodeFilter(node: Node): boolean {
    return !(
        node.nodeType !== 3 ||
        !node.isConnected ||
        node.parentElement?.nodeName === 'SCRIPT' ||
        !PATTERN.test(node.textContent ?? '')
    );
}

/**
 * Initializes the MutationObserver and sets the callbacks.
 * @param {(node: Node) => void} addCallback - Function to call when a node is added.
 * @param {(node: Node, parent: HTMLElement) => void} removeCallback - Function to call when a node is removed.
 * @private
 */
function initialize(
    addCallback: (node: Node) => void,
    removeCallback: (node: Node, parent: HTMLElement) => void
): void {
    _addCallback = addCallback;
    _observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((n) => {
                if (nodeFilter(n)) {
                    _addCallback(n);
                }
            });
            mutation.removedNodes.forEach((n) => {
                const parent = mutation.target as HTMLElement;
                removeCallback(n, parent);
            });
        });
    });
}

/**
 * Scans the DOM for text nodes matching the pattern and invokes the callback for each.
 * @param {Element} element - The DOM element to start scanning from.
 * @private
 */
function _scanDomText(element: Node): void {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                return nodeFilter(node)
                    ? PATTERN.test(node.textContent ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
                    : NodeFilter.FILTER_REJECT;
            },
        }
    );

    while (walker.nextNode()) {
        _addCallback(walker.currentNode);
    }
}

/**
 * Starts the DOM scanner to identify and process text nodes and images.
 * @param {(node: Node) => void} addCallback - Callback for node additions.
 * @param {(node: Node, parent: HTMLElement) => void} removeCallback - Callback for node removals.
 * @public
 */
function start(
    addCallback: (n: Node) => void,
    removeCallback: (n: Node, p: HTMLElement) => void
): void {
    initialize(addCallback, removeCallback);
    _scanDomText(document.body);
    _observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true, // Added to capture dynamic text updates.
    });
    _started = true;
}

/**
 * Stops the DOM scanner.
 * @public
 */
function stop(): void {
    _observer.disconnect();
    _started = false;
}

/**
 * Determines if an element is visually rendered in the document.
 * Checks if the element is part of the document and if its computed style
 * makes it visually perceivable (not `display: none`, `visibility: hidden`, or `opacity: 0`).
 * Also checks if the element has non-zero dimensions.
 * @param {Element} element - The DOM element to check.
 * @returns {boolean} - Returns `true` if the element is visually rendered, otherwise `false`.
 */
export function isStyleVisible(element: Element): boolean {
    if (!document.body.contains(element)) {
        return false;
    }
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return !(style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || rect.width === 0 || rect.height === 0);
}

/**
 * Determines if a DOM element is visible within the viewport.
 * An element might be visible in terms of CSS but not in the viewport due to scrolling.
 * @param {Element} element - The DOM element to check.
 * @returns {boolean} - Returns `true` if the element is within the viewport, otherwise `false`.
 */
export function isOnscreen(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return !(rect.bottom < 0 || rect.right < 0 || rect.left > windowWidth || rect.top > windowHeight);
}

interface Scanner {
    start: typeof start;
    stop: typeof stop;
    scanImages: boolean;
}

export const scanner: Scanner = {
    start,
    stop,
    scanImages: false
};
