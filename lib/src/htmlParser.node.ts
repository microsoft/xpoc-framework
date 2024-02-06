// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { load } from 'cheerio';

export type QueryObject = {
    nodeQuery: string;
    attribute?: string;
};

export async function query(
    url: string,
    queries: QueryObject[],
): Promise<(string | undefined)[] | Error> {
    /*
     * The User-Agent header is required to avoid getting endless redirects from some sites.
     */
    const headers = {
        'User-Agent': `XPOC/0.3.0 (+https://github.com/microsoft/xpoc-framework)`,
    };

    const htmlOrError = await fetch(url, { headers })
        .then((res: Response) => res.text())
        .catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    const $ = load(html);
    // Remove all <script> and <img> elements
    $('script', 'img').remove();
    const results: (string | undefined)[] = [];
    for (const query of queries) {
        const queryResult = $(query.nodeQuery);
        if (query.attribute) {
            results.push(queryResult.attr(query.attribute) ?? undefined);
        } else {
            results.push(queryResult.html() ?? undefined);
        }
    }
    return results;
}
