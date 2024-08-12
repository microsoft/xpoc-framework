// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    CanonicalizedAccountData,
    CanonicalizedContentData,
    Platform,
    Platforms,
    PlatformAccountData,
    PlatformContentData,
    // platforms
    Facebook,
    GitHub,
    GoogleScholar,
    Instagram,
    LINE,
    LinkedIn,
    Medium,
    Rumble,
    Snapchat,
    Telegram,
    Threads,
    TikTok,
    Vimeo,
    XTwitter,
    YouTube,
} from '../src/platform';

// the XPOC URI that appears on all our sample accounts and content (that support data fetches)
const expectedXpocUri = 'xpoc://christianpaquin.github.io!';

interface PlatformTestData {
    platform: Platform;
    accountNames: string[];
    validAccountUrls: string[];
    validContentUrls: string[];
    invalidAccountUrls: string[];
    invalidContentUrls: string[];
    canonicalAccountData: CanonicalizedAccountData[]; // must be the canonicalized version of the validAccountUrls
    canonicalContentData: CanonicalizedContentData[]; // must be the canonicalized version of the validContentUrls
    sampleAccountData: PlatformAccountData | undefined;
    sampleContentData: PlatformContentData | undefined;
}

// TODO: add more tests for each platforms: query params for all account and content URLs, vary domain case, etc.

const platformTestDataArray: PlatformTestData[] = [
    // YouTube test data
    {
        platform: new YouTube(),
        accountNames: [
            'christianpaquinmsr',
            '@christianpaquinmsr',
            ' christianpaquinmsr ',
            ' @christianpaquinmsr ',
        ],
        validAccountUrls: [
            'https://www.youtube.com/@christianpaquinmsr',
            'https://www.youtube.com/@christianpaquinmsr/',
            'https://www.youtube.com/@christianpaquinmsr/about',
            'https://youtube.com/@christianpaquinmsr',
            'https://m.youtube.com/@christianpaquinmsr',
            'https://youtu.be/@christianpaquinmsr',
        ],
        validContentUrls: [
            'https://www.youtube.com/watch?v=hDd3t7y1asU',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&feature=youtu.be',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&feature=youtu.be&t=1m30s',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&t=90s',
            'https://www.youtube.com/watch?t=90s&v=hDd3t7y1asU&feature=youtu.be',
            'https://youtube.com/watch?v=hDd3t7y1asU',
            'https://m.youtube.com/watch?v=hDd3t7y1asU',
            'https://youtu.be/watch?v=hDd3t7y1asU',
        ],
        invalidAccountUrls: [
            'https://www.youtube.com/',
            'https://www.youtube.com/watch?v=hDd3t7y1asU',
            'https://www.notyoutube.com/@christianpaquinmsr',
        ],
        invalidContentUrls: [
            'https://www.youtube.com',
            'https://www.youtube.com/@christianpaquinmsr',
            'https://www.notyoutube.com/watch?v=hDd3t7y1asU',
        ],
        canonicalAccountData: new Array(6).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://www.youtube.com/@christianpaquinmsr',
                account: 'christianpaquinmsr',
            },
        ),
        canonicalContentData: new Array(8).fill(
            // canonicalized version of validContentUrls (representing all the same content)
            {
                url: 'https://www.youtube.com/watch?v=hDd3t7y1asU',
                account: '',
                puid: 'hDd3t7y1asU',
                type: 'video',
            },
        ),
        sampleAccountData: {
            xpocUri: expectedXpocUri,
            platform: 'YouTube',
            url: 'https://www.youtube.com/@christianpaquinmsr',
            account: 'christianpaquinmsr',
        },
        sampleContentData: {
            xpocUri: expectedXpocUri,
            platform: 'YouTube',
            url: 'https://www.youtube.com/watch?v=hDd3t7y1asU',
            account: 'christianpaquinmsr',
            timestamp: '2023-07-10T17:10:28Z',
            puid: 'hDd3t7y1asU',
        },
    },

];

const hasValue = (s: string | undefined): boolean =>
    s !== undefined && s !== '';

// run tests for each platform
for (const platformTestData of platformTestDataArray) {
    const platform = platformTestData.platform;
    const platformName = platform.DisplayName;

    describe(`${platformName} platform test`, () => {
        // test(`${platformName} account name canonicalization`, () => {
        //     for (const account of platformTestData.accountNames) {
        //         const expected = platformTestData.accountNames[0];
        //         expect(platform.canonicalizeAccountName(account)).toBe(
        //             expected,
        //         );
        //     }
        // });

        // test(`${platformName} account URL validation`, () => {
        //     for (const url of platformTestData.validAccountUrls) {
        //         expect(platform.isValidAccountUrl(url)).toBe(true);
        //     }
        //     for (const url of platformTestData.invalidAccountUrls) {
        //         expect(platform.isValidAccountUrl(url)).toBe(false);
        //     }
        // });

        // if (platformTestData.validContentUrls.length > 0) {
        //     test(`${platformName} content URL validation`, () => {
        //         for (const url of platformTestData.validContentUrls) {
        //             expect(platform.isValidContentUrl(url)).toBe(true);
        //         }
        //         for (const url of platformTestData.invalidContentUrls) {
        //             expect(platform.isValidContentUrl(url)).toBe(false);
        //         }
        //     });
        // }

        // test(`${platformName} account URL canonicalization`, () => {
        //     for (let i = 0; i < platformTestData.validAccountUrls.length; i++) {
        //         const url = platformTestData.validAccountUrls[i];
        //         const canonicalData = platform.canonicalizeAccountUrl(url);
        //         const expectedCanonicalData =
        //             platformTestData.canonicalAccountData[i];
        //         if (hasValue(expectedCanonicalData.url))
        //             expect(canonicalData.url).toBe(expectedCanonicalData.url);
        //         if (hasValue(expectedCanonicalData.account))
        //             expect(canonicalData.account).toBe(
        //                 expectedCanonicalData.account,
        //             );
        //     }
        // });

        // if (platformTestData.validContentUrls.length > 0) {
        //     test(`${platformName} content URL canonicalization`, () => {
        //         for (
        //             let i = 0;
        //             i < platformTestData.validContentUrls.length;
        //             i++
        //         ) {
        //             const url = platformTestData.validContentUrls[i];
        //             const canonicalData = platform.canonicalizeContentUrl(url);
        //             const expectedCanonicalData =
        //                 platformTestData.canonicalContentData[i];
        //             if (hasValue(expectedCanonicalData.url))
        //                 expect(canonicalData.url).toBe(
        //                     expectedCanonicalData.url,
        //                 );
        //             if (hasValue(expectedCanonicalData.account))
        //                 expect(canonicalData.account).toBe(
        //                     expectedCanonicalData.account,
        //                 );
        //             if (hasValue(expectedCanonicalData.puid))
        //                 expect(canonicalData.puid).toBe(
        //                     expectedCanonicalData.puid,
        //                 );
        //             if (hasValue(expectedCanonicalData.type))
        //                 expect(canonicalData.type).toBe(
        //                     expectedCanonicalData.type,
        //                 );
        //         }
        //     });
        // }

        // if (platform.CanFetchAccountData) {
        //     test(`${platformName} account fetch test`, async () => {
        //         const sampleAccount = platformTestData.sampleAccountData;
        //         if (sampleAccount) {
        //             const accountData = await platform.getAccountData(
        //                 sampleAccount.url,
        //             );
        //             expect(accountData.xpocUri).toBe(sampleAccount.xpocUri);
        //             expect(accountData.account).toBe(sampleAccount.account);
        //             expect(accountData.platform).toBe(sampleAccount.platform);
        //             expect(accountData.url).toBe(sampleAccount.url);
        //         } else {
        //             throw new Error(
        //                 `No sample account data for ${platformName}`,
        //             );
        //         }
        //     });
        // }

        if (platform.CanFetchContentData) {
            test(`${platformName} content fetch test`, async () => {
                const sampleContent = platformTestData.sampleContentData;
                if (sampleContent) {
                    const contentData = await platform.getContentData(
                        sampleContent.url,
                    );
                    expect(contentData.xpocUri).toBe(sampleContent.xpocUri);
                    // we only compare the date part of the timestamp in the tests; some platforms
                    // inconsistently return the time part of the timestamp
                    const dateLength = 'YYYY-MM-DD'.length;
                    expect(contentData.timestamp.substring(0, dateLength)).toBe(
                        sampleContent.timestamp.substring(0, dateLength),
                    );
                    expect(contentData.url).toBe(sampleContent.url);
                    expect(contentData.platform).toBe(sampleContent.platform);
                    expect(contentData.puid).toBe(sampleContent.puid);
                    expect(contentData.account).toBe(sampleContent.account);
                } else {
                    throw new Error(
                        `No sample content data for ${platformName}`,
                    );
                }
            });
        }
    });
}

// describe('platform operations', () => {
//     test('platform support', () => {
//         // supported platforms
//         expect(Platforms.isSupportedPlatform('YouTube')).toBe(true);
//         expect(Platforms.isSupportedPlatform('X')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Twitter')).toBe(true); // X alias
//         expect(Platforms.isSupportedPlatform('Facebook')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Instagram')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Medium')).toBe(true);
//         expect(Platforms.isSupportedPlatform('TikTok')).toBe(true);
//         expect(Platforms.isSupportedPlatform('LinkedIn')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Threads')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Google Scholar')).toBe(true);
//         expect(Platforms.isSupportedPlatform('googlescholar')).toBe(true); // no space
//         expect(Platforms.isSupportedPlatform('Rumble')).toBe(true);
//         expect(Platforms.isSupportedPlatform('GitHub')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Telegram')).toBe(true);
//         expect(Platforms.isSupportedPlatform('LINE')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Snapchat')).toBe(true);
//         expect(Platforms.isSupportedPlatform('Vimeo')).toBe(true);
//         // unsupported platform
//         expect(Platforms.isSupportedPlatform('NotAPlatform')).toBe(false);
//     });

//     test('platform canonical name', () => {
//         // supported platforms (try lowercase with added white space)
//         expect(Platforms.getCanonicalPlatformName(' youTube ')).toBe('YouTube');
//         expect(Platforms.getCanonicalPlatformName(' x ')).toBe('X');
//         expect(Platforms.getCanonicalPlatformName(' twitter ')).toBe('X'); // X alias
//         expect(Platforms.getCanonicalPlatformName(' facebook ')).toBe(
//             'Facebook',
//         );
//         expect(Platforms.getCanonicalPlatformName(' instagram ')).toBe(
//             'Instagram',
//         );
//         expect(Platforms.getCanonicalPlatformName(' medium ')).toBe('Medium');
//         expect(Platforms.getCanonicalPlatformName(' tiktok ')).toBe('TikTok');
//         expect(Platforms.getCanonicalPlatformName(' linkedin ')).toBe(
//             'LinkedIn',
//         );
//         expect(Platforms.getCanonicalPlatformName(' threads ')).toBe('Threads');
//         expect(Platforms.getCanonicalPlatformName(' google scholar ')).toBe(
//             'Google Scholar',
//         );
//         expect(Platforms.getCanonicalPlatformName(' googlescholar ')).toBe(
//             'Google Scholar',
//         ); // no space
//         expect(Platforms.getCanonicalPlatformName(' rumble ')).toBe('Rumble');
//         expect(Platforms.getCanonicalPlatformName(' github ')).toBe('GitHub');
//         expect(Platforms.getCanonicalPlatformName(' telegram ')).toBe(
//             'Telegram',
//         );
//         expect(Platforms.getCanonicalPlatformName(' line ')).toBe('LINE');
//         expect(Platforms.getCanonicalPlatformName(' snapchat ')).toBe(
//             'Snapchat',
//         );
//         expect(Platforms.getCanonicalPlatformName(' vimeo ')).toBe('Vimeo');
//         // unsupported platform
//         expect(Platforms.getCanonicalPlatformName(' NotAPlatform ')).toBe(
//             'NotAPlatform',
//         );
//     });

//     test('platform account URL validation', () => {
//         // YouTube test
//         let url = 'https://www.youtube.com/@accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'YouTube',
//         );
//         // X/Twitter test
//         url = 'https://twitter.com/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe('X');
//         // Facebook test
//         url = 'https://www.facebook.com/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Facebook',
//         );
//         // Instagram test
//         url = 'https://www.instagram.com/accountname/';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Instagram',
//         );
//         // Medium test
//         url = 'https://medium.com/@accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Medium',
//         );
//         // TikTok
//         url = 'https://www.tiktok.com/@accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'TikTok',
//         );
//         // LinkedIn
//         url = 'https://www.linkedin.com/in/accountname/';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'LinkedIn',
//         );
//         // Threads
//         url = 'https://www.threads.net/@accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Threads',
//         );
//         // Google Scholar
//         url = 'https://scholar.google.com/citations?user=userid';
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Google Scholar',
//         );
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         // Rumble
//         url = 'https://rumble.com/c/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Rumble',
//         );
//         // GitHub
//         url = 'https://github.com/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'GitHub',
//         );
//         // Telegram
//         url = 'https://t.me/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Telegram',
//         );
//         // LINE: n/a
//         // Snapchat: n/a
//         // Vimeo
//         url = 'https://vimeo.com/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromAccountUrl(url)?.DisplayName).toBe(
//             'Vimeo',
//         );
//         // unsupported platform
//         url = 'https://www.notaplatform.com/accountname';
//         expect(Platforms.isSupportedAccountUrl(url)).toBe(false);
//         expect(Platforms.getPlatformFromAccountUrl(url)).toBe(undefined);
//     });

//     test('platform content URL validation', () => {
//         // YouTube test
//         let url = 'https://www.youtube.com/watch?v=abcdef12345';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'YouTube',
//         );
//         // X/Twitter test
//         url = 'https://twitter.com/accountname/status/1234567890123456789';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe('X');
//         // Facebook test
//         url = 'https://www.facebook.com/accountname/posts/123456789012345';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Facebook',
//         );
//         // Instagram test
//         url = 'https://www.instagram.com/p/ABCDEF12345/';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Instagram',
//         );
//         // Medium test
//         url = 'https://medium.com/@accountname/title-abcdef123456';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Medium',
//         );
//         // TikTok
//         url = 'https://www.tiktok.com/@accountname/video/1234567890123456789';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'TikTok',
//         );
//         // LinkedIn
//         url = 'https://www.linkedin.com/posts/title';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'LinkedIn',
//         );
//         // Threads
//         url = 'https://www.threads.net/@accountname/post/ABCD1234';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Threads',
//         );
//         // Google Scholar (no supported content)
//         url = 'https://scholar.google.com/citations?user=userid';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(false);
//         expect(Platforms.getPlatformFromContentUrl(url)).toBe(undefined);
//         // Rumble
//         url = 'https://rumble.com/abcefgh-content.html';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Rumble',
//         );
//         // GitHub (no supported content)
//         url = 'https://github.com/accountname';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(false);
//         expect(Platforms.getPlatformFromContentUrl(url)).toBe(undefined);
//         // Telegram (no supported content)
//         url = 'https://t.me/accountname';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(false);
//         expect(Platforms.getPlatformFromContentUrl(url)).toBe(undefined);
//         // LINE: n/a
//         // Snapchat: n/a
//         // Vimeo
//         url = 'https://vimeo.com/123456789';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(true);
//         expect(Platforms.getPlatformFromContentUrl(url)?.DisplayName).toBe(
//             'Vimeo',
//         );
//         // unsupported platform
//         url = 'https://www.notaplatform.com/abc123';
//         expect(Platforms.isSupportedContentUrl(url)).toBe(false);
//         expect(Platforms.getPlatformFromContentUrl(url)).toBe(undefined);
//     });

//     test('platform account URL extraction', async () => {
//         // YouTube test
//         let url = 'https://www.youtube.com/@christianpaquinmsr';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
//         let accountData = await Platforms.getAccountFromUrl(url);
//         expect(accountData.platform).toBe('YouTube');
//         expect(accountData.account).toBe('christianpaquinmsr');
//         expect(accountData.url).toBe(
//             'https://www.youtube.com/@christianpaquinmsr',
//         );

//         // X/Twitter test (no public access, expect a not supported exception)
//         url = 'https://twitter.com/chpaquin';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Facebook test (no public access, expect a not supported exception)
//         url = 'https://www.facebook.com/Microsoft';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Instagram test (no public access, expect a not supported exception)
//         url = 'https://www.instagram.com/microsoft/';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Medium test (not yet implemented (TODO), expect a not supported exception)
//         url = 'https://medium.com/@chpaquin';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // TikTok test (no public access, expect a not supported exception)
//         url = 'https://www.tiktok.com/@christian.paquin';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // LinkedIn test (no public access, expect a not supported exception)
//         url = 'https://www.linkedin.com/company/microsoft/';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Threads test (no public access, expect a not supported exception)
//         url = 'https://www.threads.net/@microsoft';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Google Scholar test (nothing to retrieve, expect a not supported exception)
//         url = 'https://scholar.google.com/citations?user=IBaguvsAAAAJ';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // Rumble test
//         url = 'https://rumble.com/c/c-4908074';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
//         accountData = await Platforms.getAccountFromUrl(url);
//         expect(accountData.platform).toBe('Rumble');
//         expect(accountData.account).toBe('c-4908074');
//         expect(accountData.url).toBe('https://rumble.com/c/c-4908074');

//         // GitHub test
//         url = 'https://github.com/christianpaquin';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
//         accountData = await Platforms.getAccountFromUrl(url);
//         expect(accountData.platform).toBe('GitHub');
//         expect(accountData.account).toBe('christianpaquin');
//         expect(accountData.url).toBe('https://github.com/christianpaquin');

//         // Telegram test (no public access, expect a not supported exception)
//         url = 'https://t.me/xpoctest';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

//         // LINE: n/a

//         // Snapchat: n/a

//         // Vimeo test
//         url = 'https://vimeo.com/xpoctester';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
//         accountData = await Platforms.getAccountFromUrl(url);
//         expect(accountData.platform).toBe('Vimeo');
//         expect(accountData.account).toBe('xpoctester');
//         expect(accountData.url).toBe('https://vimeo.com/xpoctester');

//         // unsupported platform
//         url = 'https://www.notaplatform.com/accountname';
//         expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
//         await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();
//     });

//     test('platform content URL extraction', async () => {
//         // YouTube test
//         let url = 'https://www.youtube.com/watch?v=hDd3t7y1asU';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(true);
//         let contentData = await Platforms.getContentFromUrl(url);
//         expect(contentData.platform).toBe('YouTube');
//         expect(contentData.puid).toBe('hDd3t7y1asU');
//         expect(contentData.url).toBe(
//             'https://www.youtube.com/watch?v=hDd3t7y1asU',
//         );
//         expect(contentData.account).toBe('christianpaquinmsr');
//         // YouTube inconsistently return the time part of the timestamp, we only check the date here
//         expect(contentData.timestamp.substring(0, 'YYYY-MM-DD'.length)).toBe(
//             '2023-07-10',
//         );

//         // X/Twitter test (no public access, expect a not supported exception)
//         url = 'https://twitter.com/chpaquin/status/1694698274618319246';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Facebook test (no public access, expect a not supported exception)
//         url =
//             'https://www.facebook.com/Microsoft/photos/a.10150199519298721/10150199519298721/';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Instagram test (no public access, expect a not supported exception)
//         url = 'https://www.instagram.com/p/CQ7Z1Y1JZ1s/';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Medium test (not yet implemented (TODO), expect a not supported exception)
//         url = 'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // TikTok test (no public access, expect a not supported exception)
//         url =
//             'https://www.tiktok.com/@christian.paquin/video/7282144635848346923';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // LinkedIn test (no public access, expect a not supported exception)
//         url =
//             'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880/';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Threads test (no public access, expect a not supported exception)
//         url = 'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Google Scholar test (no content URL, expect a not supported exception)
//         url = 'https://scholar.google.com/citations?user=IBaguvsAAAAJ';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Rumble test
//         url = 'https://rumble.com/v3lvq1f-crossette.html';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(true);
//         contentData = await Platforms.getContentFromUrl(url);
//         expect(contentData.platform).toBe('Rumble');
//         expect(contentData.puid).toBe('v3lvq1f-crossette');
//         expect(contentData.url).toBe(
//             'https://rumble.com/v3lvq1f-crossette.html',
//         );
//         expect(contentData.account).toBe('c-4908074');

//         // GitHub test (no content URL, expect a not supported exception)
//         url = 'https://github.com/christianpaquin';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // Telegram test (no content URL, expect a not supported exception)
//         url = 'https://t.me/xpoctest';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // LINE: n/a

//         // Snapchat: n/a

//         // Vimeo test
//         url = 'https://vimeo.com/879818126';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

//         // unsupported platform
//         url = 'https://www.notaplatform.com/abc123';
//         expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
//         await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();
//     });
// });
