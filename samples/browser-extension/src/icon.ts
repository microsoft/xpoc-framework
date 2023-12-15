// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type lookupXpocUriResult } from "./xpoc-lib"

export const CHECKMARK_URL: string = chrome.runtime.getURL('icons/checkmark.svg')
export const INVALID_URL: string = chrome.runtime.getURL('icons/invalid.svg')
export const WARNING_URL: string = chrome.runtime.getURL('icons/warning.svg')
const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;

export class Icon {

    img: Node

    constructor(public node: Node, public xpocUri: string, public status: lookupXpocUriResult) {
        this.img = Icon.createIcon(status.type)
        this.setIcon()
    }

    static createIcon(status: string): HTMLImageElement {
        let path: string
        switch (status) {
            case 'notFound':
            case 'error':
                path = INVALID_URL
                break
            case 'account':
            case 'content':
                path = CHECKMARK_URL
                break
            case 'warning':
                path = WARNING_URL
                break
            default:
                throw new Error('Unknown status')
        }
        const img = document.createElement('img')
        img.style.height = '1.5em'
        img.style.width = '1.5em'
        img.setAttribute('src', path)
        img.setAttribute('xpoc', 'xpocIcon')
        return img
    }

    public setIcon(replaceLink: boolean = false): void {
        const node = this.node
        const img = this.img
        const textNode = (node as Text)
        const text = textNode.textContent ?? ''
        // const xpocUriIndex = text.indexOf(this.xpocUri)
        if (replaceLink) {
            node.textContent = text.replace(PATTERN, '')
        }

        node.parentElement?.setAttribute('xpoc', 'xpocLink')

        if (!(node.nextSibling instanceof HTMLImageElement && node.nextSibling?.getAttribute('xpoc') === 'xpocIcon')) {
            if (!textNode.textContent?.endsWith(' ')) {
                textNode.textContent += ' '
            }
            // inserts the image after the text node
            // this works even if there is no next sibling
            node.parentNode?.insertBefore(img, node.nextSibling)
        }
    }

    set onClick(value: () => void) {
        this.img.addEventListener('click', _event => {
            setTimeout(value)
        })
    }

}