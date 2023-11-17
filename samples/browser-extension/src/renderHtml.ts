// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { store as dbStore, get as dbGet } from './indexdb.js'

const ruleId = 1;
const stripXFrameOriginRule: chrome.declarativeNetRequest.Rule = {
    id: ruleId,
    priority: 1,
    action: {
        type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: [
            {
                header: "x-frame-options",
                operation: "remove" as chrome.declarativeNetRequest.HeaderOperation.REMOVE
            },
            {
                header: "content-security-policy",
                operation: "remove" as chrome.declarativeNetRequest.HeaderOperation.REMOVE
            }
        ]
    },
    condition: {
        urlFilter: "*://*/*",
        resourceTypes: [
            "sub_frame" as chrome.declarativeNetRequest.ResourceType.SUB_FRAME
        ]
    }
}


/**
 * Import into background.js
 * 
 * The function `downloadDocumentListener` listens for messages from the Chrome runtime and performs various
 * actions based on the message type.
 */
export function downloadDocumentListener(): void {

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

        /* 
            Injects a function into the specified IFrame
            The injected function requires an encryption key and an initialization vector (IV)
        */
        if (message.type === "INJECT_FRAME") {
            let frameId: number
            const tabId = sender.tab?.id as number
            let key: number[]
            let iv: number[]
            chrome.webNavigation.getAllFrames({ tabId })
                .then((frames) => {
                    frameId = frames?.find((frame) => frame.url === message.url)?.frameId as number
                    return crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, ["encrypt"])
                })
                .then((key) => {
                    return crypto.subtle.exportKey('raw', key)
                })
                .then((arrayBufferKey) => {
                    iv = Array.from(crypto.getRandomValues(new Uint8Array(16)));
                    key = Array.from(new Uint8Array(arrayBufferKey));
                    return chrome.scripting.executeScript({ target: { tabId, frameIds: [frameId] }, func: injectFunction, args: [key, iv] })
                })
                .then(() => {
                    sendResponse({ type: 'INJECT_IFRAME_COMPLETE', key, iv });
                })
                .catch((error) => {
                    sendResponse({ type: 'INJECT_IFRAME_ERROR', error });
                })
        }

        /*
            Adds a header filter to the declarativeNetRequest API
            The filter removes the X-Frame-Options and Content-Security-Policy headers from subframes
            matching the specified URL.
            The IFrame's URL is modified to include a unique query parameter, used as a filter condition to prevent 
            the filter from being applied to other IFrames 
        */
        if (message.type === "ADD_HEADER_FILTER") {
            chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] })
                .then(() => {
                    stripXFrameOriginRule.condition.urlFilter = message.url;
                    return chrome.declarativeNetRequest.updateDynamicRules({ addRules: [stripXFrameOriginRule as chrome.declarativeNetRequest.Rule] })
                })
                .then(() => {
                    sendResponse({ type: 'ADD_HEADER_FILTER_COMPLETE' });
                })
        }

        /*
            Removes the header filter from the declarativeNetRequest API
            We only wanted the header filter in place for the duration of the IFrame's load
        */
        if (message.type === "REMOVE_HEADER_FILTER") {
            chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] })
                .then(() => {
                    sendResponse({ type: 'REMOVE_HEADER_FILTER_COMPLETE' });
                })
        }

        /*
            Stores a URL and its corresponding HTML content in an IndexDB database.
        */
        if (message.type === "CACHE_DOCUMENT") {
            dbStore(message.url, message.html)
            .then(() => {
                sendResponse({ type: 'DOCUMENT_CACHED' });
            })
        }

        /*
            Retrieves a URL and its corresponding HTML content from an IndexDB database.
        */
        if (message.type === "GET_DOCUMENT") {
            dbGet(message.url)
                .then((html) => {
                    if (!html) {
                        console.log("Document not found in cache:", message.url);
                    }
                    sendResponse(html);
                })
        }

        return true;
    })

}


/**
 * Injected into the IFrame
 * 
 * Encrypts the current HTML document after removing certain elements, using AES-CBC encryption,
 * and sends the result to the parent window. Utilizes a key and an initialization vector (IV).
 * @param {number[]} key - Array of numbers representing the AES-CBC encryption key.
 * @param {number[]} iv - Initialization Vector, a unique and unpredictable array of numbers used
 *                        for each encryption to ensure distinct ciphertext for identical plaintext.
 */
const injectFunction = (key: number[], iv: number[]) => {
    const doc = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');
    doc.querySelectorAll('img, script, path, style').forEach(node => node.parentNode && node.parentNode.removeChild(node));
    const html = doc.documentElement.outerHTML
    crypto.subtle.importKey('raw', new Uint8Array(key), { name: 'AES-CBC', length: 256 }, false, ['encrypt'])
        .then((key) => {
            return crypto.subtle.encrypt({ name: 'AES-CBC', iv: new Uint8Array(iv) }, key, new TextEncoder().encode(html))
        })
        .then((encryptedHtml) => {
            parent.postMessage({ type: "IFRAME_RESPONSE", html: Array.from(new Uint32Array(encryptedHtml)) }, '*');
        })
}


/**
 * Import into content.js
 * 
 * Asynchronously downloads a document from a specified URL and returns a `Document` object.
 * Optionally caches the document for future use.
 * @param {string} url - URL of the document to download.
 * @param {boolean} [cache=true] - If true, checks for and returns a cached version if available. 
 *                                 If false, downloads a fresh copy.
 * @returns {Promise<Document>} A Promise that resolves to the downloaded Document object.
*/
export async function downloadDocument(url: string, cache = true): Promise<Document> {

    // Check for a cached version of the document are return it if available
    const cachedDoc = cache ? await message('GET_DOCUMENT', { url }) as string | undefined : undefined
    if (cachedDoc) {
        return new DOMParser().parseFromString(cachedDoc, 'text/html');
    }

    // generate a unique query parameter to prevent the header filter from being applied to other IFrames
    const rndBytes = await crypto.getRandomValues(new Uint8Array(16));
    let string = ''
    for (let i = 0; i < rndBytes.length; i++) {
        string += String.fromCharCode(rndBytes[i]);
    }
    const base64String = btoa(string);
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    searchParams.set(chrome.runtime.id, base64String);
    urlObj.search = searchParams.toString();
    const frameUrl = urlObj.toString();

    // Enable the header filter for the duration of the IFrame's load
    // Some sites may block the IFrame from loading if certain headers are present (e.g. X-Frame-Options)
    await message('ADD_HEADER_FILTER', { url: frameUrl })

    // Create the IFrame
    const sandbox = false
    const iframe = await new Promise<HTMLIFrameElement>((resolve, reject) => {
        const iframe = document.createElement('iframe');
        sandbox && iframe.sandbox.add('allow-scripts');
        iframe.src = frameUrl
        iframe.style.display = 'none';
        iframe.onload = function () {
            console.log("createFrame complete", frameUrl, sandbox);
            resolve(iframe);
        }
        iframe.onerror = function (event) {
            console.error("Error loading iframe:", event);
            if ((iframe as HTMLIFrameElement).parentNode) {
                document.body.removeChild(iframe as HTMLIFrameElement);
            }
        }
        document.body.appendChild(iframe);
    })

    // Disable the header filter
    await message('REMOVE_HEADER_FILTER')

    // Inject the function into the IFrame. The repose will include the encryption key and IV to allow decryption.
    // The tab will not have access to this code and cannot decrypt the document.
    const { iv, key } = await message('INJECT_FRAME', { url: frameUrl }) as { iv: number[], key: number[] }

    // Listen for the IFrame's response with the encrypted HTML as an array of 32-bit integers
    const htmlArray = await new Promise<number[]>((resolve, reject) => {
        const responseHandler = (event: MessageEvent) => {
            if (event.data.type !== "IFRAME_RESPONSE") { return }
            const html = event.data.html as number[]
            resolve(html)
            window.removeEventListener('message', responseHandler);
        }
        window.addEventListener('message', responseHandler);
    })

    // Remove the IFrame
    document.body.removeChild(iframe);

    // Decrypt the HTML to text
    const htmlText = await crypto.subtle.importKey('raw', new Uint8Array(key), { name: 'AES-CBC', length: 256 }, false, ['decrypt'])
        .then((key) => {
            return crypto.subtle.decrypt({ name: 'AES-CBC', iv: new Uint8Array(iv) }, key, new Uint32Array(htmlArray))
        })
        .then((arrayBufferHtml) => {
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(arrayBufferHtml);
        })

    // Parse the HTML text into a Document object
    // Again, the tab cannot access this script so it cannot access the Document object here
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');

    // Cache the document for future use
    cache && await message('CACHE_DOCUMENT', { url, html: htmlText })

    return doc
}


/**
 * Sends a message to background.js and returns a Promise that resolves with the result.
 * @param {string} type - Identifies the purpose or category of the message.
 * @param {Record<string, unknown>} [data] - Optional key-value pairs to send additional data.
 * @returns {Promise<any>} A Promise that resolves with the response.
 */
async function message(type: string, data?: Record<string, unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, ...data }, (result) => {
            resolve(result)
        })
    })
}
