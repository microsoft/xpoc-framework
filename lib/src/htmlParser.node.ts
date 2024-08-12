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
        Cookie: 'LOGIN_INFO=AFmmF2swRQIgDOD9dP33CouHlOMvqgGfXy7WhA-kbAqYgIQLU_UHMxgCIQDkYtstUMeDI4ApGzsieOOVa4psuBdEReLGM5nl8E6dwA:QUQ3MjNmeDBMa0hBVWFScFA0cDd1UFhiaV83QnR3ZTdOMEFaX0YxVzFaUkVSbTNJMnZEVU8zUDJvVWdXME1ZX3JSOFZ6VlJUcEJhVEpZUXFWQmdtSE5wMkRPNE5vWERoWFJUaHdGRUU1YmQ5a1ZHVXR5Zm1kTElDeTVfMzZqYV9pMnJwRVBEYkdORkEyaVBmbUJqbTZ3OWk1aTF4LXBtdGFR; HSID=Alc8IxYLnYXz5rIHN; SSID=A9Uvyb-qVOLDBcjcf; APISID=UTzoarQswHTdKJnh/ARAFqxvcjePj7dcTm; SAPISID=5fj-c8XfmfsCnF6B/AIvk9du0IJnUcULAC; __Secure-1PAPISID=5fj-c8XfmfsCnF6B/AIvk9du0IJnUcULAC; __Secure-3PAPISID=5fj-c8XfmfsCnF6B/AIvk9du0IJnUcULAC; VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgUw%3D%3D; VISITOR_INFO1_LIVE=lMiUs9IOJMM; NID=515=h6wGL9xuNTNtu0VEmDDBsbeXexYV1Th7jshfNyYqYK3V-eQOyoJMWto2tITFhBp8LjrNN35qezbuNri5ISO-AMNi9n_etHd3zZeSr1IGJ_v5MAcm8FUOVubfDio46qlFMuBKeducsS82fJzatykg7_G-ldqRnnNhkEWDn-6fbix7WSJenqsil_YaQCT5nU380GFJn2GTAEIdYFbHUZqANPimYI2z1nZEzqNqQTZV7HAm2ik; VISITOR_INFO1_LIVE=lMiUs9IOJMM; VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgUw%3D%3D; SID=g.a000mwgBGdKgYhaY-E6VaiX7y7-qHLBwuMwJnYHuz-pSAl2fs-YYiPADeUY7pmlzMbovqZD4HgACgYKASYSARESFQHGX2MilhAf_CpeX2AdSnIItHO41RoVAUF8yKrHrES0lhlEaO07ZjxdofS50076; __Secure-1PSID=g.a000mwgBGdKgYhaY-E6VaiX7y7-qHLBwuMwJnYHuz-pSAl2fs-YY6d9W3DbIjFhvFn9eEF1oagACgYKAfwSARESFQHGX2MinyUm48ngUnKNj5Yk8QW_BxoVAUF8yKr8kE6905Mb5jUdIumUSiHC0076; __Secure-3PSID=g.a000mwgBGdKgYhaY-E6VaiX7y7-qHLBwuMwJnYHuz-pSAl2fs-YYKzY0aZahPDyuInl2gKPibwACgYKAbgSARESFQHGX2MiZtc_eB0g4bOFqkxk7qEkLBoVAUF8yKohIcuCRquKFzxdiDbtUY7e0076; PREF=f6=40000000&f7=4140&tz=America.Los_Angeles&f5=20000&f4=4000000; YSC=PVm6-O8vkps; YT_CL={"loctok":"ACih6ZOBUHQTC631OBJeV6CydAiYtFepAClWOsgYCsYIWcp512D0445VGQCEXPJHYdNumW8Pf-D_mGwFyJSCQFGzgoVle0AQi84"}; __Secure-1PSIDTS=sidts-CjIBUFGoh3g_GCCXNBXNwQrwuyMQT0BCIBkG9-deVjakWO0SMN_SBjrV3hPpLfUwsCG6bBAA; __Secure-3PSIDTS=sidts-CjIBUFGoh3g_GCCXNBXNwQrwuyMQT0BCIBkG9-deVjakWO0SMN_SBjrV3hPpLfUwsCG6bBAA; SIDCC=AKEyXzU5xB9jDoEBFiuIiYrOg5KNsoWKn7N1-vZUWniMqXmSoSkrAE7_auqbRpwcxmJs_hXR_HM; __Secure-1PSIDCC=AKEyXzUMQBrKzmV3y2XVAhfGcSe9H-8y40RDJOPySL1wCSd4UNDkQUNEYUVK7S792bmZMwN4QtQ; __Secure-3PSIDCC=AKEyXzU9Yiga1ppUTEGoAV8pIKBeMQSnQ2jMM5XaCwOKH48hFrrTRihsOQCygtIq1AsaEGZJZZQ0',
        'upgrade-insecure-requests': '1',
        Dnt: '1',
        'Cache-Control': 'max-age=0',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
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
    setTimeout(() => {
        console.info('--------------------------------------------------------------------');
        console.info(html);
        console.info('--------------------------------------------------------------------');
    }, 1000);
    return results;
}
