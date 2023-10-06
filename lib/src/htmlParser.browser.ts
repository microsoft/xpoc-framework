// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const cache = new Map<string, Document>();

export async function query(url: string, nodeQuery: string, attribute: string): Promise<string | undefined | Error> {
    const htmlOrError = await fetch(url).then((res: Response) => res.text()).catch((err: Error) => err);
    if (htmlOrError instanceof Error) return htmlOrError;
    const html: string = htmlOrError;
    let document = cache.get(url)
    if( !document ) {
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