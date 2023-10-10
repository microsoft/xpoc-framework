// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type CheerioAPI, load } from "cheerio";

export async function query(url: string, nodeQuery: string, attribute?: string): Promise<string | undefined | Error> {
    const htmlOrError = await fetch(url).then((res: Response) => res.text()).catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    const $ = load(html)
    // Remove all <script> and <img> elements
    $('script', 'img').remove();
    const queryResult = $(nodeQuery)
    if (attribute) return queryResult.attr(attribute) ?? undefined
    return queryResult.html() ?? undefined
}
