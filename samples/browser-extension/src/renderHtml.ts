// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { store as dbStore, get as dbGet } from './indexdb.js'

/*

    background.js
    Import this file into your background script

*/
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


export function backgroundListener(): void {

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

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

        if (message.type === "REMOVE_HEADER_FILTER") {
            chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] })
                .then(() => {
                    sendResponse({ type: 'REMOVE_HEADER_FILTER_COMPLETE' });
                })
        }

        if (message.type === "CACHE_DOCUMENT") {
            dbStore(message.url, message.html)
            .then(() => {
                sendResponse({ type: 'DOCUMENT_CACHED' });
            })
        }

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

const injectFunction = (key: number[], iv: number[]) => {
    const doc = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');
    doc.querySelectorAll('img, script, path, style').forEach(node => node.parentNode && node.parentNode.removeChild(node));
    const html = doc.documentElement.outerHTML
    crypto.subtle.importKey('raw', new Uint8Array(key), { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt'])
        .then((key) => {
            return crypto.subtle.encrypt({ name: 'AES-CBC', iv: new Uint8Array(iv) }, key, new TextEncoder().encode(html))
        })
        .then((encryptedHtml) => {
            parent.postMessage({ type: "IFRAME_RESPONSE", html: Array.from(new Uint32Array(encryptedHtml)) }, '*');
        })
}


/*

    content.js
    Import this file into your content script

*/
export async function downloadDocument(url: string, cache = true): Promise<Document> {

    console.log("createFrame", url);

    const cachedDoc = cache ? await message('GET_DOCUMENT', { url }) as string | undefined : undefined

    if (cachedDoc) {
        return new DOMParser().parseFromString(cachedDoc, 'text/html');
    }

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

    await message('ADD_HEADER_FILTER', { url: frameUrl })

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

    await message('REMOVE_HEADER_FILTER')

    const { iv, key } = await message('INJECT_FRAME', { url: frameUrl }) as { iv: number[], key: number[] }

    const htmlArray = await new Promise<number[]>((resolve, reject) => {
        const responseHandler = (event: MessageEvent) => {
            if (event.data.type !== "IFRAME_RESPONSE") { return }
            const html = event.data.html as number[]
            resolve(html)
            window.removeEventListener('message', responseHandler);
        }
        window.addEventListener('message', responseHandler);
    })

    document.body.removeChild(iframe);

    const htmlText = await crypto.subtle.importKey('raw', new Uint8Array(key), { name: 'AES-CBC', length: 256 }, false, ['decrypt'])
        .then((key) => {
            return crypto.subtle.decrypt({ name: 'AES-CBC', iv: new Uint8Array(iv) }, key, new Uint32Array(htmlArray))
        })
        .then((arrayBufferHtml) => {
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(arrayBufferHtml);
        })

    const doc = new DOMParser().parseFromString(htmlText, 'text/html');

    cache && await message('CACHE_DOCUMENT', { url, html: htmlText })

    return doc
}

async function message<T, R>(type: string, data?: Record<string, unknown>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
        chrome.runtime.sendMessage({ type, ...data } as T, (result) => {
            resolve(result as R)
        })
    })
}
