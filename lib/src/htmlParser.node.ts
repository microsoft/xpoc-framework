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
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36`,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Content-Type': 'text/html;',
        Cookie: 'name=value; name2=value2',
        'upgrade-insecure-requests': '1',
        Dnt: '1',
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
    console.debug(`Querying ${url}`);
    for (const query of queries) {
        const queryResult = $(query.nodeQuery);
        console.debug(`Querying ${queryResult.toString().replace(/>/g, '\n')}`);
        if (query.attribute) {
            results.push(queryResult.attr(query.attribute) ?? undefined);
        } else {
            results.push(queryResult.html() ?? undefined);
        }
    }
    return results;
}
