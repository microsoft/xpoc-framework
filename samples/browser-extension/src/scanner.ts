// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class DomScanner {
    #addCallback: (node: Node) => void;
    #removeCallback: (node: Node) => void;
    #test: (node: Node) => boolean;
    #observer: MutationObserver;
    #enabled: boolean = false;

    constructor(
        test: (node: Node) => boolean,
        addCallback: (node: Node) => void,
        removeCallback: (node: Node) => void,
    ) {
        this.#test = test;
        this.#addCallback = addCallback;
        this.#removeCallback = removeCallback;
        this.#observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                /*
                    only the top-level node(s) will be in this list
                    so we need to scan the node and its children
                 */
                mutation.addedNodes.forEach((n) => this.scanDomText(n));
                mutation.removedNodes.forEach((n) => this.scanDomText(n));
            });
        });
    }

    public start(): void {
        if (this.#enabled) {
            return;
        }
        this.scanDomText(document.body);
        this.#observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });
        this.#enabled = true;
    }

    public stop(): void {
        if (!this.#enabled) {
            return;
        }
        this.#observer.disconnect();
        this.#enabled = false;
    }

    /**
     * Scans a DOM node and its children for passing the test
     * For each matching text-node, the callback is invoked
     *
     * @param {Element} rootNode
     * @returns {void}
     * @private
     */
    private scanDomText(rootNode: Node): void {
        const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node: Node) => {
                    return this.#test(node)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                },
            },
        );
        while (walker.nextNode() != null) {
            this.#addCallback(walker.currentNode);
        }
    }
}

export default DomScanner;
