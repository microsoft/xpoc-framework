// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;

let _addCallback: (node: Node) => void
let _observer: MutationObserver
let _started = false

/**
 * Internal constructor called on initialization
 * Sets up the MutationObserver
 * @private
 */
function initialize(addCallback: (node: Node) => void, removeCallback: (node: Node) => void): void {
  _addCallback = addCallback
  _observer = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(n => {
        /* ignore disconnected elements and scripts */
        if (!n.isConnected) {
          return
        }
        _scanDomText(n)
      })
      mutation.removedNodes.forEach(n => {
        removeCallback(n)
      })
    })
  })
}

/**
 * Scans a DOM element and its children for text-nodes matching the pattern
 * For each matching text-node, the callback is invoked
 *
 * @param {Element} element
 * @returns {void}
 * @private
 */
function _scanDomText(element: Node): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: HTMLElement) => {
        // Check if the node or its ancestors is a <script> tag
        if (node.nodeName === 'SCRIPT' || node?.parentElement?.nodeName === 'SCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        return PATTERN.test(node.textContent ?? '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  )
  while (walker.nextNode() != null) {
    _addCallback(walker.currentNode)
  }
}

/**
 * Starts the scanner.
 * Text-nodes matching the pattern and IMG elements (if enabled) are sent to the addCallback
 * Returned IMG element will be in a 'loaded' state
 * Nodes that are removed from the DOM are sent to the removeCallback
 *
 * @public
 * @param {(node: Node) => void} addCallback
 * @param {(node: Node) => void} removeCallback
 * @returns {void}
 */
function start(addCallback: (n: Node) => void, removeCallback: (n: Node) => void): void {
  // eslint-disable-next-line no-new
  initialize(addCallback, removeCallback)
  _scanDomText(document.body)
  _observer.observe(document.body, { childList: true, subtree: true, attributes: true })
  _started = true
  // characterData: true, to capture dynamic text updates
}

/**
 * Stops the scanner.
 *
 * @public
 */
function stop(): void {
  _observer.disconnect()
  _started = false
}

export const scanner: Scanner = {
  start,
  stop,
  scanImages: false
}

interface Scanner {
  start: typeof start
  stop: typeof stop
  scanImages: boolean
}
