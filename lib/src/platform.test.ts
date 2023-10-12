// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    CanonicalizedAccountData, CanonicalizedContentData, Platform, Platforms, PlatformAccountData, PlatformContentData,
    // platforms
    Facebook, GitHub, GoogleScholar, Instagram, LinkedIn, Medium, Rumble, Threads, TikTok, XTwitter, YouTube
} from './platform';

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
            ' @christianpaquinmsr '
        ],
        validAccountUrls: [
            'https://www.youtube.com/@christianpaquinmsr',
            'https://www.youtube.com/@christianpaquinmsr/',
            'https://www.youtube.com/@christianpaquinmsr/about',
            'https://youtube.com/@christianpaquinmsr/about',
            'https://m.youtube.com/@christianpaquinmsr/about',
            'https://youtu.be/@christianpaquinmsr/about'
        ],
        validContentUrls: [
            'https://www.youtube.com/watch?v=hDd3t7y1asU',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&feature=youtu.be',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&feature=youtu.be&t=1m30s',
            'https://www.youtube.com/watch?v=hDd3t7y1asU&t=90s',
            'https://www.youtube.com/watch?t=90s&v=hDd3t7y1asU&feature=youtu.be',
            'https://youtube.com/watch?v=hDd3t7y1asU',
            'https://m.youtube.com/watch?v=hDd3t7y1asU',
            'https://youtu.be/watch?v=hDd3t7y1asU'
        ],
        invalidAccountUrls: [
            'https://www.youtube.com/',
            'https://www.youtube.com/watch?v=hDd3t7y1asU',
            'https://www.notyoutube.com/@christianpaquinmsr/about'
        ],
        invalidContentUrls: [
            'https://www.youtube.com',
            'https://www.youtube.com/@christianpaquinmsr',
            'https://www.notyoutube.com/watch?v=hDd3t7y1asU'
        ],
        canonicalAccountData: new Array(6).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://www.youtube.com/@christianpaquinmsr/about',
                account: 'christianpaquinmsr'
            }
        ),
        canonicalContentData: new Array(8).fill(
            // canonicalized version of validContentUrls (representing all the same content)
            {
                url: 'https://www.youtube.com/watch?v=hDd3t7y1asU',
                account: '',
                puid: 'hDd3t7y1asU',
                type: 'video'
            }
        ),
        sampleAccountData: {
            xpocUri: expectedXpocUri,
            platform: "YouTube",
            url: "https://www.youtube.com/@christianpaquinmsr/about",
            account: "christianpaquinmsr",
        },
        sampleContentData: {
            xpocUri: expectedXpocUri,
            platform: "YouTube",
            url: "https://www.youtube.com/watch?v=hDd3t7y1asU",
            account: "christianpaquinmsr",
            timestamp: "2023-07-10T17:10:28Z",
            puid: "hDd3t7y1asU"
        }
    },

    // X/Twitter test data
    {
        platform: new XTwitter(),
        accountNames: [
            'chpaquin',
            '@chpaquin',
            ' chpaquin ',
            ' @chpaquin '
        ],
        validAccountUrls: [
            'https://twitter.com/chpaquin',
            'https://twitter.com/@chpaquin',
            'https://x.com/chpaquin'
        ],
        validContentUrls: [
            'https://twitter.com/chpaquin/status/1694698274618319246',
            'https://x.com/chpaquin/status/1694698274618319246',
            'https://twitter.com/@chpaquin/status/1694698274618319246'
        ],
        invalidAccountUrls: [
            'https://twitter.com',
            'https://twitter.com/chpaquin/status/1694698274618319246',
            'https://nottwitter.com/chpaquin/status/1694698274618319246'
        ],
        invalidContentUrls: [
            'https://twitter.com',
            'https://twitter.com/chpaquin',
            'https://nottwitter.com/chpaquin/status/1694698274618319246'
        ],
        canonicalAccountData: new Array(3).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://twitter.com/chpaquin',
                account: 'chpaquin'
            }
        ),
        canonicalContentData: new Array(3).fill(
            // canonicalized version of validContentUrls (representing all the same content)
            {
                url: 'https://twitter.com/chpaquin/status/1694698274618319246',
                account: 'chpaquin',
                puid: '1694698274618319246',
                type: 'post'
            }
        ),
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Facebook test data
    {
        platform: new Facebook(),
        accountNames: [
            'Microsoft',
            ' Microsoft '
        ],
        validAccountUrls: [
            'https://www.facebook.com/Microsoft',
            'https://www.facebook.com/Microsoft/',
            'https://www.facebook.com/Microsoft/about',
            'https://m.facebook.com/Microsoft',
            'https://facebook.com/Microsoft',
            'https://fb.com/Microsoft'
        ],
        validContentUrls: [
            'https://www.facebook.com/Microsoft/photos/650054900501286',
            'https://www.facebook.com/photo?fbid=650054900501286',
            'https://www.facebook.com/Microsoft/videos/165720489879335',
            'https://www.facebook.com/Microsoft/photos/a.195193573720/10159789051448721/'
        ],
        invalidAccountUrls: [
            'https://www.facebook.com',
            'https://www.facebook.com/Microsoft/photo/650054900501286',
            'https://www.notfacebook.com/Microsoft'
        ],
        invalidContentUrls: [
            'https://www.facebook.com',
            'https://www.facebook.com/Microsoft',
            'https://www.notfacebook.com/Microsoft/photo/650054900501286'
        ],
        canonicalAccountData: new Array(6).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://www.facebook.com/Microsoft',
                account: 'Microsoft'
            }
        ),
        canonicalContentData: [
            // canonicalized version of validContentUrls
            {
                url: 'https://www.facebook.com/Microsoft/photos/650054900501286',
                account: 'Microsoft',
                puid: '',
                type: 'photo'
            },
            {
                url: 'https://www.facebook.com/photo?fbid=650054900501286',
                account: '',
                puid: '650054900501286',
                type: 'photo'
            },
            {
                url: 'https://www.facebook.com/Microsoft/videos/165720489879335',
                account: 'Microsoft',
                puid: '',
                type: 'video'
            },
            {
                url: 'https://www.facebook.com/Microsoft/photos/a.195193573720/10159789051448721/',
                account: 'Microsoft',
                puid: '',
                type: 'photo'
            }
        ],
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Instagram test data
    {
        platform: new Instagram(),
        accountNames: [
            'microsoft',
            ' microsoft '
        ],
        validAccountUrls: [
            'https://www.instagram.com/microsoft',
            'https://www.instagram.com/microsoft/',
            'https://m.instagram.com/microsoft',
            'https://instagram.com/microsoft/'
        ],
        validContentUrls: [
            'https://www.instagram.com/p/Cw25Z6KJvMa',
            'https://www.instagram.com/p/Cw25Z6KJvMa/',
            'https://www.instagram.com/p/Cw25Z6KJvMa/?img_index=1',
            'https://www.instagram.com/reel/CwQiom2IBrP',
            'https://www.instagram.com/reel/CwQiom2IBrP/'
        ],
        invalidAccountUrls: [
            'https://www.instagram.com',
            'https://www.instagram.com/p/Cw25Z6KJvMa/',
            'https://www.notinstagram.com/microsoft'
        ],
        invalidContentUrls: [
            'https://www.instagram.com',
            'https://www.instagram.com/microsoft/',
            'https://www.notinstagram.com/p/Cw25Z6KJvMa/'
        ],
        canonicalAccountData: new Array(4).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://www.instagram.com/microsoft/',
                account: 'microsoft'
            }
        ),
        canonicalContentData: [
            // canonicalized version of validContentUrls (first 3 are the same, last 2 are the same)
            ...new Array(3).fill(
                {
                    url: 'https://www.instagram.com/p/Cw25Z6KJvMa/',
                    account: '',
                    puid: 'Cw25Z6KJvMa',
                    type: 'post'
                }
            ),
            ...new Array(2).fill(
                {
                    url: 'https://www.instagram.com/reel/CwQiom2IBrP/',
                    account: '',
                    puid: 'CwQiom2IBrP',
                    type: 'reel'
                }
            )
        ],
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Medium test data
    {
        platform: new Medium(),
        accountNames: [
            'chpaquin',
            '@chpaquin',
            ' chpaquin ',
            ' @chpaquin '
        ],
        validAccountUrls: [
            // default form
            'https://medium.com/@chpaquin',
            'https://medium.com/@chpaquin/',
            'https://www.medium.com/@chpaquin',
            'https://medium.com/@chpaquin?utm_source=bing&utm_content=textlink',
            'https://medium.com/@chpaquin/about',
            'https://medium.com/@chpaquin/about/',
            // subdomain form
            'https://christianpaquin.medium.com',
            'https://christianpaquin.medium.com/',
            'https://christianpaquin.medium.com/about',
            'https://christianpaquin.medium.com/about/',
            'https://christianpaquin.medium.com?utm_source=bing&utm_content=textlink'
        ],
        validContentUrls: [
            // default form
            'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8',
            'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8/',
            'https://www.medium.com/@chpaquin/xpoc-test-4fecf28be9a8',
            'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8?utm_source=bing&utm_content=textlink',
            // subdomain form
            'https://christianpaquin.medium.com/hello-world-d4011bf78829',
            'https://christianpaquin.medium.com/hello-world-d4011bf78829/',
            'https://christianpaquin.medium.com/hello-world-d4011bf78829?utm_source=bing&utm_content=textlink',
            // short form
            'https://medium.com/p/4fecf28be9a8',
            'https://medium.com/p/4fecf28be9a8/',
            'https://www.medium.com/p/4fecf28be9a8',
            'https://medium.com/p/4fecf28be9a8?utm_source=bing&utm_content=textlink',
        ],
        invalidAccountUrls: [
            'https://medium.com',
            'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8',
            'https://notmedium.com/@chpaquin'
        ],
        invalidContentUrls: [
            'https://medium.com',
            'https://medium.com/@chpaquin',
            'https://notmedium.com/@chpaquin/xpoc-test-4fecf28be9a8'
        ],
        canonicalAccountData: [
            // canonicalized version of validAccountUrls (first 6 are the same, last 5 are the same)
            ...new Array(6).fill(
                {
                    url: 'https://medium.com/@chpaquin',
                    account: 'chpaquin'
                }
            ),
            ...new Array(5).fill(
                {
                    url: 'https://christianpaquin.medium.com',
                    account: 'christianpaquin'
                }
            )
        ],
        canonicalContentData: [
            // canonicalized version of validContentUrls (first 4, next 3, and last 3 are the same)
            ...new Array(4).fill(
                {
                    url: 'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8',
                    account: 'chpaquin',
                    puid: '4fecf28be9a8',
                    type: 'post'
                }
            ),
            ...new Array(3).fill(
                {
                    url: 'https://christianpaquin.medium.com/hello-world-d4011bf78829',
                    account: 'christianpaquin',
                    puid: 'd4011bf78829',
                    type: 'post'
                }
            ),
            ...new Array(4).fill(
                {
                    url: 'https://medium.com/p/4fecf28be9a8',
                    account: '',
                    puid: '4fecf28be9a8',
                    type: 'post'
                }
            )
        ],
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // TikTok test data
    {
        platform: new TikTok(),
        accountNames: [
            'microsoft',
            '@microsoft',
            ' microsoft ',
            ' @microsoft '
        ],
        validAccountUrls: [
            'https://www.tiktok.com/@microsoft',
            'https://www.tiktok.com/@microsoft/',
            'https://www.tiktok.com/@microsoft?lang=en',
            'https://www.tiktok.com/@a_valid_account.name1234',
        ],
        validContentUrls: [
            'https://www.tiktok.com/@microsoft/video/7281710200761978155',
            'https://www.tiktok.com/@microsoft/video/7281710200761978155/',
            'https://tiktok.com/@microsoft/video/7281710200761978155',
            'https://www.tiktok.com/@microsoft/video/7281710200761978155?lang=en'
        ],
        invalidAccountUrls: [
            'https://tiktok.com',
            'https://www.tiktok.com/@microsoft/video/7281710200761978155',
            'https://www.nottiktok.com/@microsoft'
        ],
        invalidContentUrls: [
            'https://tiktok.com',
            'https://www.tiktok.com/@microsoft',
            'https://www.nottiktok.com/@microsoft/video/7281710200761978155'
        ],
        canonicalAccountData: [
            ...new Array(3).fill(
                // canonicalized version of validAccountUrls (first 3 are the same)
                {
                    url: 'https://www.tiktok.com/@microsoft',
                    account: 'microsoft'
                },
            ),
            {
                url: 'https://www.tiktok.com/@a_valid_account.name1234',
                account: 'a_valid_account.name1234'
            }],
        canonicalContentData: new Array(4).fill(
            // canonicalized version of validContentUrls (representing all the same content)
            {
                url: 'https://www.tiktok.com/@microsoft/video/7281710200761978155',
                account: 'microsoft',
                puid: '7281710200761978155',
                type: 'video'
            }
        ),
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // LinkedIn test data
    {
        platform: new LinkedIn(),
        accountNames: [
            'microsoft',
            ' microsoft '
        ],
        validAccountUrls: [
            'https://www.linkedin.com/in/paquinchristian/',
            'https://www.linkedin.com/in/paquinchristian',
            'https://linkedin.com/in/paquinchristian/',
            'https://www.linkedin.com/company/microsoft/',
            'https://www.linkedin.com/company/microsoft',
            'https://linkedin.com/company/microsoft/',
            'https://www.linkedin.com/school/universite-de-montreal/',
            'https://www.linkedin.com/school/universite-de-montreal',
            'https://ca.linkedin.com/school/universite-de-montreal'
        ],
        validContentUrls: [
            'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880/',
            'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880',
            'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880/?utm_source=share&utm_medium=member_desktop',
            'https://www.linkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx/',
            'https://www.linkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx',
            'https://www.linkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx/?utm_source=share&utm_medium=member_desktop',
        ],
        invalidAccountUrls: [
            'https://www.linkedin.com',
            'https://www.linkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx',
            'https://www.notlinkedin.com/company/microsoft/'
        ],
        invalidContentUrls: [
            'https://www.linkedin.com',
            'https://www.linkedin.com/company/microsoft/',
            'https://www.notlinkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx'
        ],
        canonicalAccountData: [
            // canonicalized version of validAccountUrls (1st, 2nd, 3rd group of 3 are the same)
            ...new Array(3).fill(
                {
                    url: 'https://www.linkedin.com/in/paquinchristian/',
                    account: 'paquinchristian'
                },
            ),
            ...new Array(3).fill(
                {
                    url: 'https://www.linkedin.com/company/microsoft/about/',
                    account: 'microsoft'
                },
            ),
            ...new Array(3).fill(
                {
                    url: 'https://www.linkedin.com/school/universite-de-montreal/about/',
                    account: 'universite-de-montreal'
                },
            )
        ],
        // canonicalized version of validContentUrls (1st, 2nd group of 3 are the same)
        canonicalContentData: [
            ...new Array(3).fill(
                {
                    url: 'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880/',
                    account: '',
                    puid: '',
                    type: 'event'
                }
            ),
            ...new Array(3).fill(
                {
                    url: 'https://www.linkedin.com/posts/microsoft_over-150-unique-sessions-fuel-the-inaugural-activity-6846553561166442496-sRwx/',
                    account: '',
                    puid: '',
                    type: 'post'
                }
            )
        ],
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Threads test data
    {
        platform: new Threads(),
        accountNames: [
            'microsoft',
            '@microsoft',
            ' microsoft ',
            ' @microsoft '
        ],
        validAccountUrls: [
            'https://www.threads.net/@microsoft',
            'https://www.threads.net/@microsoft/',
            'https://www.threads.net/microsoft',
            'https://threads.net/@microsoft'
        ],
        validContentUrls: [
            'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-',
            'https://threads.net/@microsoft/post/Cx3OmEtRKw-',
            'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-/',
            'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-/?utm_source=share&utm_medium=member_desktop'
        ],
        invalidAccountUrls: [
            'https://www.threads.net',
            'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-',
            'https://www.notthreads.net/@microsoft'
        ],
        invalidContentUrls: [
            'https://www.threads.net',
            'https://www.threads.net/@microsoft',
            'https://www.notthreads.net/@microsoft/post/Cx3OmEtRKw-'
        ],
        canonicalAccountData: new Array(4).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://www.threads.net/@microsoft',
                account: 'microsoft'
            }
        ),
        canonicalContentData: new Array(4).fill(
            // canonicalized version of validContentUrls (representing all the same content)
            {
                url: 'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-',
                account: 'microsoft',
                puid: 'Cx3OmEtRKw-',
                type: 'post'
            }
        ),
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Google Scholar test data
    {
        platform: new GoogleScholar(),
        accountNames: [
            'IBaguvsAAAAJ',
            ' IBaguvsAAAAJ '
        ],
        validAccountUrls: [
            'https://scholar.google.com/citations?user=IBaguvsAAAAJ',
            'https://scholar.google.com/citations?user=IBaguvsAAAAJ&hl=en',
            'https://scholar.google.com/citations?hl=en&user=IBaguvsAAAAJ'
        ],
        validContentUrls: [
            // n/a
        ],
        invalidAccountUrls: [
            'https://scholar.google.com',
            'https://notscholar.google.com/citations?user=IBaguvsAAAAJ',
        ],
        invalidContentUrls: [
            // n/a
        ],
        canonicalAccountData: new Array(3).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://scholar.google.com/citations?user=IBaguvsAAAAJ',
                account: 'IBaguvsAAAAJ'
            }
        ),
        canonicalContentData: [
            // n/a
        ],
        sampleAccountData: undefined,
        sampleContentData: undefined
    },

    // Rumble test data
    {
        platform: new Rumble(),
        accountNames: [
            'c-4908074',
            ' c-4908074 ',
            '/c/c-4908074',
            'c/c-4908074',
        ],
        validAccountUrls: [
            'https://rumble.com/c/c-4908074/',
            'https://rumble.com/c/c-4908074',
            'https://rumble.com/c-4908074/',
            'https://rumble.com/c-4908074',
            'https://rumble.com/c/abcd1234/',
            'https://rumble.com/c/abcd1234',
            'https://rumble.com/abcd1234/',
            'https://rumble.com/abcd1234'
        ],
        validContentUrls: [
            'https://rumble.com/v3lvq1f-crossette.html',
            'https://rumble.com/v3lvq1f-crossette',
            'https://rumble.com/v3lvq1f-crossette.html/',
            'https://rumble.com/v3lvq1f-crossette/'
        ],
        invalidAccountUrls: [
            'https://rumble.com/c-49080740', // 8 digits instead of 7
            'https://rumble.com/c/c-49080740', // 8 digits instead of 7
            'https://rumble.com/a/c-4908074'
        ],
        invalidContentUrls: [
            'https://rumble.com/c/v3lvq1f-crossette.html',
            'https://rumble.com/c/v3lvq1f-crossette'
        ],
        canonicalAccountData: [

            ...new Array(4).fill(
                {
                    url: 'https://rumble.com/c/c-4908074',
                    account: 'c-4908074'
                }
            ),
            ...new Array(4).fill(
                {
                    url: 'https://rumble.com/c/abcd1234',
                    account: 'abcd1234'
                }
            )
        ],
        canonicalContentData: [
            ...new Array(4).fill(
                {
                    url: 'https://rumble.com/v3lvq1f-crossette.html',
                    account: '',
                    puid: 'v3lvq1f-crossette',
                    type: 'video'
                }
            )
        ],
        sampleAccountData: {
            xpocUri: expectedXpocUri,
            platform: "Rumble",
            url: "https://rumble.com/c/c-4908074",
            account: "c-4908074",
        },
        sampleContentData: {
            xpocUri: expectedXpocUri,
            platform: "Rumble",
            url: "https://rumble.com/v3lvq1f-crossette.html",
            account: "c-4908074",
            timestamp: "2023-09-29T00:00:00Z",
            puid: "v3lvq1f-crossette"
        }
    },

    // GitHub test data
    {
        platform: new GitHub(),
        accountNames: [
            'christianpaquin',
            ' christianpaquin '
        ],
        validAccountUrls: [
            'https://github.com/christianpaquin',
            'https://github.com/christianpaquin/',
            'https://www.github.com/christianpaquin',
            'https://github.com/christianpaquin?utm_source=bing&utm_content=textlink'
        ],
        validContentUrls: [
            // n/a
        ],
        invalidAccountUrls: [
            'https://github.com',
            'https://notgithub.com/christianpaquin',
        ],
        invalidContentUrls: [
            // n/a
        ],
        canonicalAccountData: new Array(4).fill(
            // canonicalized version of validAccountUrls (representing all the same account)
            {
                url: 'https://github.com/christianpaquin',
                account: 'christianpaquin'
            }
        ),
        canonicalContentData: [
            // n/a
        ],
        sampleAccountData: {
            xpocUri: expectedXpocUri,
            platform: "GitHub",
            url: "https://github.com/christianpaquin",
            account: "christianpaquin",
        },

        sampleContentData: undefined
    }

];

const hasValue = (s: string | undefined): boolean => s !== undefined && s !== '';

// run tests for each platform
for (const platformTestData of platformTestDataArray) {
    const platform = platformTestData.platform;
    const platformName = platform.DisplayName;

    describe(`${platformName} platform test`, () => {

        test(`${platformName} account name canonicalization`, () => {
            for (const account of platformTestData.accountNames) {
                const expected = platformTestData.accountNames[0];
                expect(platform.canonicalizeAccountName(account)).toBe(expected);
            }
        });

        test(`${platformName} account URL validation`, () => {
            for (const url of platformTestData.validAccountUrls) {
                expect(platform.isValidAccountUrl(url)).toBe(true);
            }
            for (const url of platformTestData.invalidAccountUrls) {
                expect(platform.isValidAccountUrl(url)).toBe(false);
            }
        });

        if (platformTestData.validContentUrls.length > 0) {
            test(`${platformName} content URL validation`, () => {
                for (const url of platformTestData.validContentUrls) {
                    expect(platform.isValidContentUrl(url)).toBe(true);
                }
                for (const url of platformTestData.invalidContentUrls) {
                    expect(platform.isValidContentUrl(url)).toBe(false);
                }
            });
        }

        test(`${platformName} account URL canonicalization`, () => {
            for (let i = 0; i < platformTestData.validAccountUrls.length; i++) {
                const url = platformTestData.validAccountUrls[i];
                const canonicalData = platform.canonicalizeAccountUrl(url);
                const expectedCanonicalData = platformTestData.canonicalAccountData[i];
                if (hasValue(expectedCanonicalData.url)) expect(canonicalData.url).toBe(expectedCanonicalData.url);
                if (hasValue(expectedCanonicalData.account)) expect(canonicalData.account).toBe(expectedCanonicalData.account);
            }
        });

        if (platformTestData.validContentUrls.length > 0) {
            test(`${platformName} content URL canonicalization`, () => {
                for (let i = 0; i < platformTestData.validContentUrls.length; i++) {
                    const url = platformTestData.validContentUrls[i];
                    const canonicalData = platform.canonicalizeContentUrl(url);
                    const expectedCanonicalData = platformTestData.canonicalContentData[i];
                    if (hasValue(expectedCanonicalData.url)) expect(canonicalData.url).toBe(expectedCanonicalData.url);
                    if (hasValue(expectedCanonicalData.account)) expect(canonicalData.account).toBe(expectedCanonicalData.account);
                    if (hasValue(expectedCanonicalData.puid)) expect(canonicalData.puid).toBe(expectedCanonicalData.puid);
                    if (hasValue(expectedCanonicalData.type)) expect(canonicalData.type).toBe(expectedCanonicalData.type);
                }
            });
        }

        if (platform.CanFetchAccountData) {
            test(`${platformName} account fetch test`, async () => {
                const sampleAccount = platformTestData.sampleAccountData;
                if (sampleAccount) {
                    const accountData = await platform.getAccountData(sampleAccount.url);
                    expect(accountData.xpocUri).toBe(sampleAccount.xpocUri);
                    expect(accountData.account).toBe(sampleAccount.account);
                    expect(accountData.platform).toBe(sampleAccount.platform);
                    expect(accountData.url).toBe(sampleAccount.url);
                } else {
                    throw new Error(`No sample account data for ${platformName}`);
                }
            });
        }

        if (platform.CanFetchContentData) {
            test(`${platformName} content fetch test`, async () => {
                const sampleContent = platformTestData.sampleContentData;
                if (sampleContent) {
                    const contentData = await platform.getContentData(sampleContent.url);
                    expect(contentData.xpocUri).toBe(sampleContent.xpocUri);
                    // we only compare the date part of the timestamp in the tests; some platforms
                    // inconsistently return the time part of the timestamp
                    const dateLength = "YYYY-MM-DD".length;
                    expect(contentData.timestamp.substring(0, dateLength)).toBe(sampleContent.timestamp.substring(0, dateLength));
                    expect(contentData.url).toBe(sampleContent.url);
                    expect(contentData.platform).toBe(sampleContent.platform);
                    expect(contentData.puid).toBe(sampleContent.puid);
                    expect(contentData.account).toBe(sampleContent.account);
                } else {
                    throw new Error(`No sample content data for ${platformName}`);
                }
            });
        }
    });
}

describe('platform operations', () => {
    test('platform account URL validation', () => {
        // YouTube test
        expect(Platforms.isSupportedAccountUrl('https://www.youtube.com/@accountname/about')).toBe(true);
        // X/Twitter test
        expect(Platforms.isSupportedAccountUrl('https://twitter.com/accountname')).toBe(true);
        // Facebook test
        expect(Platforms.isSupportedAccountUrl('https://www.facebook.com/accountname')).toBe(true);
        // Instagram test
        expect(Platforms.isSupportedAccountUrl('https://www.instagram.com/accountname/')).toBe(true);
        // Medium test
        expect(Platforms.isSupportedAccountUrl('https://medium.com/@accountname')).toBe(true);
        // TikTok
        expect(Platforms.isSupportedAccountUrl('https://www.tiktok.com/@accountname')).toBe(true);
        // LinkedIn
        expect(Platforms.isSupportedAccountUrl('https://www.linkedin.com/in/accountname/')).toBe(true);
        // Threads
        expect(Platforms.isSupportedAccountUrl('https://www.threads.net/@accountname')).toBe(true);
        // Google Scholar
        expect(Platforms.isSupportedAccountUrl('https://scholar.google.com/citations?user=userid')).toBe(true);
        // Rumble
        expect(Platforms.isSupportedAccountUrl('https://rumble.com/c/accountname')).toBe(true);
        // GitHub
        expect(Platforms.isSupportedAccountUrl('https://github.com/accountname')).toBe(true);
        // unsupported platform
        expect(Platforms.isSupportedAccountUrl('https://www.notaplatform.com/accountname')).toBe(false);
    });

    test('platform content URL validation', () => {
        // YouTube test
        expect(Platforms.isSupportedContentUrl('https://www.youtube.com/watch?v=abcdef12345')).toBe(true);
        // X/Twitter test
        expect(Platforms.isSupportedContentUrl('https://twitter.com/accountname/status/1234567890123456789')).toBe(true);
        // Facebook test
        expect(Platforms.isSupportedContentUrl('https://www.facebook.com/accountname/photos/123456789012345')).toBe(true);
        // Instagram test
        expect(Platforms.isSupportedContentUrl('https://www.instagram.com/p/ABCDEF12345/')).toBe(true);
        // Medium test
        expect(Platforms.isSupportedContentUrl('https://medium.com/@accountname/title-abcdef123456')).toBe(true);
        // TikTok
        expect(Platforms.isSupportedContentUrl('https://www.tiktok.com/@accountname/video/1234567890123456789')).toBe(true);
        // LinkedIn
        expect(Platforms.isSupportedContentUrl('https://www.linkedin.com/posts/title')).toBe(true);
        // Threads
        expect(Platforms.isSupportedContentUrl('https://www.threads.net/@accountname/post/ABCD1234')).toBe(true);
        // Google Scholar (no supported content)
        expect(Platforms.isSupportedContentUrl('https://scholar.google.com/citations?user=userid')).toBe(false);
        // Rumble
        expect(Platforms.isSupportedContentUrl('https://rumble.com/abcefgh-content.html')).toBe(true);
        // GitHub (no supported content)
        expect(Platforms.isSupportedContentUrl('https://github.com/accountname')).toBe(false);
        // unsupported platform
        expect(Platforms.isSupportedContentUrl('https://www.notaplatform.com/abc123')).toBe(false);
    });

    test('platform account URL extraction', async () => {
        // YouTube test
        let url = 'https://www.youtube.com/@christianpaquinmsr';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
        let accountData = await Platforms.getAccountFromUrl(url);
        expect(accountData.platform).toBe('YouTube');
        expect(accountData.account).toBe('christianpaquinmsr');
        expect(accountData.url).toBe('https://www.youtube.com/@christianpaquinmsr/about');

        // X/Twitter test (no public access, expect a not supported exception)
        url = 'https://twitter.com/chpaquin';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Facebook test (no public access, expect a not supported exception)
        url = 'https://www.facebook.com/Microsoft';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Instagram test (no public access, expect a not supported exception)
        url = 'https://www.instagram.com/microsoft/';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Medium test (not yet implemented (TODO), expect a not supported exception)
        url = 'https://medium.com/@chpaquin';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // TikTok test (no public access, expect a not supported exception)
        url = 'https://www.tiktok.com/@christian.paquin';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // LinkedIn test (no public access, expect a not supported exception)
        url = 'https://www.linkedin.com/company/microsoft/';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Threads test (no public access, expect a not supported exception)
        url = 'https://www.threads.net/@microsoft';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Google Scholar test (nothing to retrieve, expect a not supported exception)
        url = 'https://scholar.google.com/citations?user=IBaguvsAAAAJ';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();

        // Rumble test
        url = 'https://rumble.com/c/c-4908074';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
        accountData = await Platforms.getAccountFromUrl(url);
        expect(accountData.platform).toBe('Rumble');
        expect(accountData.account).toBe('c-4908074');
        expect(accountData.url).toBe('https://rumble.com/c/c-4908074');

        // GitHub test
        url = 'https://github.com/christianpaquin';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(true);
        accountData = await Platforms.getAccountFromUrl(url);
        expect(accountData.platform).toBe('GitHub');
        expect(accountData.account).toBe('christianpaquin');
        expect(accountData.url).toBe('https://github.com/christianpaquin');

        // unsupported platform
        url = 'https://www.notaplatform.com/accountname';
        expect(Platforms.canFetchAccountFromUrl(url)).toBe(false);
        await expect(Platforms.getAccountFromUrl(url)).rejects.toThrow();
    });

    test('platform content URL extraction', async () => {
        // YouTube test
        let url = 'https://www.youtube.com/watch?v=hDd3t7y1asU';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(true);
        let contentData = await Platforms.getContentFromUrl(url);
        expect(contentData.platform).toBe('YouTube');
        expect(contentData.puid).toBe('hDd3t7y1asU');
        expect(contentData.url).toBe('https://www.youtube.com/watch?v=hDd3t7y1asU');
        expect(contentData.account).toBe('christianpaquinmsr');
        // YouTube inconsistently return the time part of the timestamp, we only check the date here
        expect(contentData.timestamp.substring(0, "YYYY-MM-DD".length)).toBe('2023-07-10');

        // X/Twitter test (no public access, expect a not supported exception)
        url = 'https://twitter.com/chpaquin/status/1694698274618319246';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Facebook test (no public access, expect a not supported exception)
        url = 'https://www.facebook.com/Microsoft/photos/a.10150199519298721/10150199519298721/';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Instagram test (no public access, expect a not supported exception)
        url = 'https://www.instagram.com/p/CQ7Z1Y1JZ1s/';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Medium test (not yet implemented (TODO), expect a not supported exception)
        url = 'https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // TikTok test (no public access, expect a not supported exception)
        url = 'https://www.tiktok.com/@christian.paquin/video/7282144635848346923';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // LinkedIn test (no public access, expect a not supported exception)
        url = 'https://www.linkedin.com/events/thefutureofwork-reinventingprod7038508574142074880/';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Threads test (no public access, expect a not supported exception)
        url = 'https://www.threads.net/@microsoft/post/Cx3OmEtRKw-';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Google Scholar test (no content URL, expect a not supported exception)
        url = 'https://scholar.google.com/citations?user=IBaguvsAAAAJ';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // Rumble test 
        url = 'https://rumble.com/v3lvq1f-crossette.html';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(true);
        contentData = await Platforms.getContentFromUrl(url);
        expect(contentData.platform).toBe('Rumble');
        expect(contentData.puid).toBe('v3lvq1f-crossette');
        expect(contentData.url).toBe('https://rumble.com/v3lvq1f-crossette.html');
        expect(contentData.account).toBe('c-4908074');

        // GitHub test (no content URL, expect a not supported exception)
        url = 'https://github.com/christianpaquin';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();

        // unsupported platform
        url = 'https://www.notaplatform.com/abc123';
        expect(Platforms.canFetchContentFromUrl(url)).toBe(false);
        await expect(Platforms.getContentFromUrl(url)).rejects.toThrow();
    });
});
