// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

type QueryObject = {
    nodeQuery: string;
    attribute: string;
};

export async function query(url: string, queries: QueryObject[]): Promise<(string | undefined)[] | Error> {
    const htmlOrError = await fetch(url).then((res: Response) => res.text()).catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const errorNode = document.querySelector("parsererror");
    if (errorNode) {
        return new Error('Failed to parse HTML')
    }
    // Remove all <script> and <img> elements
    // DOMParser().parseFromString does not evaluate scripts, but it does load images
    document.querySelectorAll('script, img').forEach(script => {
        script.parentNode?.removeChild(script);
    });
    const results: (string | undefined)[] = [];
    for (const query of queries) {
        const node = document.querySelector(query.nodeQuery) ?? undefined;
        results.push(node?.getAttribute(query.attribute) ?? undefined);
        }
    return results;
}   