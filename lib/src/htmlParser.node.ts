// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type CheerioAPI, load } from "cheerio";
import { Platforms } from "./platform.js";

const cache = new Map<string, CheerioAPI>();
const allowedHosts : RegExp[] = []

function isAllowedHost(url: string): boolean {
    for (const host of allowedHosts) {
        if (host.test(url)) return true
    }
    return false
}

export async function query(url: string, nodeQuery: string, attribute?: string): Promise<string | undefined | Error> {
    // Initialize allowed hosts if not already done
    if (allowedHosts.length === 0) {
        for (const platform of Platforms.platforms) {
            allowedHosts.push(new RegExp(platform.regexHostnameString))
        }
    }
    if (!isAllowedHost(url)) return new Error(`Host ${url} not allowed`);
    const htmlOrError = await fetch(url).then((res: Response) => res.text()).catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    let $ = cache.get(url)
    if (!$) {
        try {
            $ = load(html)
        } catch (err) {
            console.error(err);
            throw new Error('Failed to parse HTML');
        }
        cache.set(url, $);
    }
    const queryResult = $(nodeQuery)
    if (attribute) return queryResult.attr(attribute) ?? undefined
    return queryResult.html() ?? undefined
}
