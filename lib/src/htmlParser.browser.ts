// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Platforms } from "./platform";

const cache = new Map<string, Document>();
const allowedHosts: RegExp[] = []

export function isAllowedHost(url: string): boolean {
    for (const host of allowedHosts) {
        if (host.test(url)) return true
    }
    return false
}

export async function query(url: string, nodeQuery: string, attribute: string): Promise<string | undefined | Error> {
    // Initialize allowed hosts if not already done
    if (allowedHosts.length === 0) {
        for (const platform of Platforms.platforms) {
            allowedHosts.push(new RegExp(platform.regexHostnameString))
        }
    }
    const htmlOrError = await fetch(url).then((res: Response) => res.text()).catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    let document = cache.get(url)
    if (!document) {
        try {
            document = new DOMParser().parseFromString(html, 'text/html');
        } catch (err) {
            console.error(err);
            throw new Error('Failed to parse HTML');
        }
        cache.set(url, document);
    }
    const node = document.querySelector(nodeQuery) ?? undefined;
    return node?.getAttribute(attribute) ?? undefined;
}   