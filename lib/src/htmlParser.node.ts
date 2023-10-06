// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type CheerioAPI, load } from "cheerio";

const cache = new Map<string, CheerioAPI>();

export async function query(url: string, nodeQuery: string, attribute?: string): Promise<string | undefined | Error> {
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