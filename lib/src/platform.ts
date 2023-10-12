// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { query } from "./htmlParser.node.js";

export type ContentType = 'post' | 'photo' | 'video' | 'reel' | 'event' | 'misc';

const ACCOUNT_STR = "^ACCOUNT^";
const PUID_STR = "^PUID^";
const ACCOUNT_TYPE_STR = "^ACCCOUNTTYPE^";

export interface PlatformAccountData {
    xpocUri: string,
    platform: string,
    url: string,
    account: string
}

export interface PlatformContentData extends PlatformAccountData {
    timestamp: string,
    puid: string
}

export interface CanonicalizedAccountData {
    url: string,
    account: string
}

export interface CanonicalizedContentData extends CanonicalizedAccountData {
    puid: string,
    type: ContentType
}

// TODO: move each platform to its own file? (maybe not, since they're smaller due to refactor)
export abstract class Platform {
    // the platform's display name
    public DisplayName: string;

    // canonical hostname
    public CanonicalHostname: string;

    // account path URL template (after the hostname) 
    public AccountPathUrlTemplate: string;

    // content path URL template (after the hostname) 
    public ContentPathUrlTemplate: string;

    // returns true if the platform account data is accessible (either publicly, or through pre-configured API access)
    // if true, @see getAccountData can be called
    public CanFetchAccountData: boolean;

    // returns true if the platform content data is accessible (either publicly, or through pre-configured API access)
    // if true, @see getContentData can be called
    public CanFetchContentData: boolean;

    // regex strings used to validate and canonicalize hostname URLs
    public regexHostnameString: string;

    // regex strings used to validate and canonicalize account URLs
    protected accountRegexString: string;

    // regex strings used to validate and canonicalize content URLs
    protected contentRegexString: string;

    constructor(displayName: string, canonicalHostname: string, accountUrlTemplate: string, contentUrlTemplate: string,
        canFetchAccountData: boolean, canFetchContentData: boolean,
        regexHostnameString: string, accountRegexStringSuffix: string, contentRegexStringSuffix: string) {
        this.DisplayName = displayName;
        this.CanonicalHostname = canonicalHostname;
        this.AccountPathUrlTemplate = accountUrlTemplate;
        this.ContentPathUrlTemplate = contentUrlTemplate;
        this.CanFetchAccountData = canFetchAccountData;
        this.CanFetchContentData = canFetchContentData;
        this.regexHostnameString = regexHostnameString;
        this.accountRegexString = regexHostnameString + accountRegexStringSuffix;
        this.contentRegexString = regexHostnameString + contentRegexStringSuffix;
    }

    // returns true if the given URL is a valid account URL on the platform
    isValidAccountUrl(url: string): boolean {
        const accountRegex = new RegExp(this.accountRegexString);
        return accountRegex.test(url);
    }

    // returns true if the given URL is a valid content URL on the platform
    isValidContentUrl(url: string): boolean {
        const contentRegex = new RegExp(this.contentRegexString);
        return contentRegex.test(url);
    }

    // returns the canonical account name
    canonicalizeAccountName(account: string): string {
        return account.trim();
    }

    // transforms an account URL into the platform's canonical form
    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error(`Malformed ${this.DisplayName} account URL`);
        }
        // extract the @account name from the account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            return {
                url: this.CanonicalHostname + "/" + this.AccountPathUrlTemplate.replace(ACCOUNT_STR, accountName),
                account: accountName
            }
        } else {
            const errMsg = `Malformed ${this.DisplayName} account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    // transforms a content URL into the platform's canonical form
    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error(`Malformed ${this.DisplayName} content URL`);
        }
        // extract the content data from the content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName || '';
            const puid = match.groups.puid || '';
            const type = match.groups.type || '';
            return {
                account: accountName,
                puid: puid,
                type: this.filterType(type),
                url: this.CanonicalHostname + "/" +
                     this.ContentPathUrlTemplate.replace(PUID_STR, puid).replace(ACCOUNT_STR, accountName).replace(ACCOUNT_TYPE_STR, type)
            }
        } else {
            const errMsg = `Malformed YouTube content URL: can't extract video ID`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    // returns the canonical type given the type parsed in a content URL
    filterType(type: string | undefined): ContentType {
        return 'misc';
    }

    // returns the account data for a given account URL on the platform
    // throws an error if not supported for the platform (if CanFetchData is false)
    async getAccountData(url: string): Promise<PlatformAccountData> {
        throw new Error('Not supported');
    }

    // returns the content data for a given content URL on the platform
    // throws an error if not supported for the platform (if CanFetchData is false)
    async getContentData(url: string): Promise<PlatformContentData> {
        throw new Error('Not supported');
    }
}

// extracts a XPOC URI from a string
const findXpocUri = (text: string | undefined) => {
    if (!text) { throw new Error("Invalid content; can't search for XPOC URI"); }
    // XPOC URI regex, to capture the manifest URL
    const xpocRegex = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/g;
    const match = xpocRegex.exec(text);
    if (match) {
        return match[0]; // return the captured group
    } else {
        throw new Error('Content does not contain a XPOC URI');
    }
}

const trimAndRemoveAtPrefix = (str: string) => {
    return str.trim().replace('@', '');
}

// converts data-time strings to UTC strings
const toUTCString = (dateStr: string): string => {
    if (!dateStr) { return ''; }
    // Check if the string contains a time component
    const hasTime = /(\d{1,2}:\d{2}(:\d{2})?)/.test(dateStr);
    // If it does, convert it to UTC
    // If not, append T00:00:00Z to the UTC date
    // Date() will convert the date to the local timezone and we get different results 
    // depending on the timezone of the machine
    const dt = new Date(dateStr).toISOString();
    return hasTime ? dt : dt.replace(/T.*/, 'T00:00:00Z');
}

// TODO: make sure all regex ignore the case of the hostname

// YouTube platform implementation. This implementation fetches YouTube URLs directly.
// An alternate implementation could make use of the YouTube API, which would require
// an API key and a Google account.
export class YouTube extends Platform {
    constructor() {
        super('YouTube', 'https://www.youtube.com',
            `@${ACCOUNT_STR}`,  `watch?v=${PUID_STR}`,
            true, true,
            // matches YouTube URLs, with or without www. or m. subdomains
            "^https?://(?:www\\.|m\\.)?(youtube\\.com|youtu\\.be)",
            // matches YouTube account URLs, with an optional 'about/' path
            `/@(?<accountName>[^/]+)(/about)?/?$`,
            // matches YouTube content URLs with a watch path and a 'v' query parameter
            `/watch\\?(?:[^&]*&)*v=(?<puid>[\\w-]{11})(?:&[^ ]*)?$`
        );
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    async getAccountData(url: string): Promise<PlatformAccountData> {
        const accountData = this.canonicalizeAccountUrl(url);
        try {
            const description = await query(accountData.url, 'meta[name="description"]', 'content') as string;
            const xpocUri = findXpocUri(description);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: accountData.url,
                account: accountData.account
            };

        } catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    }

    async getContentData(url: string): Promise<PlatformContentData> {
        const contentData = this.canonicalizeContentUrl(url);
        try {
            const channelUrl = await query(contentData.url, 'span[itemprop="author"] link[itemprop="url"]', 'href') as string;
            const account = channelUrl?.split('/').pop()?.replace('@', '') || '';
            const postTime = await query(contentData.url, 'meta[itemprop="datePublished"]', 'content') as string;
            const videoDescription = await query(contentData.url, 'meta[name="description"]', 'content') as string;
            const xpocUri = findXpocUri(videoDescription);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: contentData.url,
                account: account,
                timestamp: toUTCString(postTime),
                puid: contentData.puid
            };
        } catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    }

    filterType = (type: string | undefined): ContentType => 'video';
}

// X/Twitter platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class XTwitter extends Platform {

    constructor() {
        super('X', 'https://twitter.com',
            `${ACCOUNT_STR}`, `${ACCOUNT_STR}/status/${PUID_STR}`, 
            false, false, // TODO: "X" name will not match "Twitter" (make more robust)
            // matches X/Twitter URLs, with or without a www. subdomain
            "^https?://(?:www\\.)?(twitter\\.com|x\\.com)",
            // matches X/Twitter account URLs, with an optional '@' prefix (gets removed by redirect)
            `/@?(?<accountName>[a-zA-Z0-9_]{1,15})$`,
            // matches X/Twitter content URLs with a status path and a status ID path
            `/@?(?<accountName>[a-zA-Z0-9_]{1,15})/status/(?<puid>\\d{1,19})$`
        );
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    filterType = (type: string | undefined): ContentType => 'post';
}

// Facebook platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class Facebook extends Platform {

    constructor() {
        super('Facebook', 'https://www.facebook.com',
            `${ACCOUNT_STR}`, ``, // not using the base class implementation for content URLs
            false, false,
            // matches Facebook URLs, with or without www. or m. subdomains
            `^https?://(?:www\\.|m\\.)?(facebook\\.com|fb\\.com)`,
            // matches Facebook account URLs, with an optional 'about/' path
            `/(?<accountName>[^/]+)(/about)?/?$`, // TODO: ignore query parameters and anchors
            // matches Facebook content URLs (posts/photos/videos/reels), either with a account name path of a fbid query parameter
            // TODO: Facebook has many types of valid content URLs, this could be improved 
            `/(?:(?<accountName>\\w+)/(?:(?<contentType>posts|photos|videos|reels)/)|(?<contentType2>post|photo|video|reel)\\?.*?fbid=(?<fbid>\\d+))`
        );
    }

    filterType(type: string): ContentType {
        switch (type) {
            case 'posts':
            case 'post':
                return 'post';
            case 'photos':
            case 'photo':
                return 'photo';
            case 'videos':
            case 'video':
                return 'video';
            case 'reels':
            case 'reel':
                return 'reel';
            default:
                return 'misc';
        }
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed Facebook content URL');
        }
        // extract what we can from the Facebook content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const fbID = match.groups.fbid;
            const contentType = match.groups.contentType || match.groups.contentType2;
            const accountName = match.groups.accountName;
            const hostnameRegex = new RegExp(this.regexHostnameString + '(?<pathAndParameters>.*)');
            const pathAndParamsMatch = hostnameRegex.exec(url);
            let canonicalUrl = url;
            if (pathAndParamsMatch && pathAndParamsMatch.groups) {
                canonicalUrl = `${this.CanonicalHostname}${pathAndParamsMatch.groups.pathAndParameters}`;
            }
            return {
                account: accountName,
                puid: fbID,
                type: this.filterType(contentType),
                url: canonicalUrl
            }
        } else {
            const errMsg = `Malformed Facebook content URL`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }
}

// Instagram platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class Instagram extends Platform {
    constructor() {
        super('Instagram', 'https://www.instagram.com',
            `${ACCOUNT_STR}/`, `${ACCOUNT_TYPE_STR}/${PUID_STR}/`,
            false, false,
            // matches Instagram URLs, with or without www. or m. subdomains
            `^https?://(?:www\\.|m\\.)?(instagram\\.com)`,
            // matches Instagram account URLs
            `/(?<accountName>[^/]+)/?$`, // TODO: ignore query parameters and anchors
            // matches Instagram content URLs (a post or reel)
            `/(?<type>p|reel)/(?<puid>[a-zA-Z0-9_-]+)/?(?:\\?.*?)?$`
        );
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    filterType(type: string): ContentType {
        switch (type) {
            case 'p':
                return 'post';
            case 'reel':
                return 'reel';
            default:
                return 'misc';
        }
    }
}

// Medium platform implementation.
export class Medium extends Platform {
    // account regex (default form) - matches https://medium.com/@accountName with optional /about path and query params
    private defaultAccountRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/@(?<accountName>[^\/?]+)(?:\/about)?\/?(?:\\?.*)?$';
    // account regex (subdomain form) - matches https://accountName.medium.com with optional /about path and query params
    private subdomainFormRegexString = '^https?:\/\/(?<accountName>[^\\.]+)\\.medium\\.com(?:\/about)?\/?(?:\\?.*)?$';

    // content regex (default form) - matches https://medium.com/@accountName/title-storyID with optional query params  
    private defaultContentRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/@(?<accountName>[^\/]+)\/(?<title>[^\/]+)-(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';
    // content regex (subdomain form) - matches https://accountName.medium.com/title-storyID with optional query params
    private subdomainContentRegexString = '^https?:\/\/(?<accountName>[^\\.]+)\\.medium\\.com\/(?<title>[^\/]+)-(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';
    // content regex (short form) - matches https://medium.com/p/storyID with optional query params
    private shortContentRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/p\/(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';

    constructor() {
        super('Medium', 'https://medium.com',
            '', '', // we don't use the base class implementation
            false, false, // some (most) accounts and stories are publicly available, so we could make these true (TODO)
            // not using the base class regexp strings, because of how Medium URLs are structured
            '', '', '' // we don't use the base class implementation
        );
    }

    // override base class's implementation
    isValidAccountUrl(url: string): boolean {
        // test the default form
        let accountRegex = new RegExp(this.defaultAccountRegexString);
        if (accountRegex.test(url)) {
            return true;
        }
        // test the subdomain form
        accountRegex = new RegExp(this.subdomainFormRegexString);
        if (accountRegex.test(url)) {
            return true;
        }
        // url doesn't match either account form
        return false;
    }

    // override base class's implementation
    isValidContentUrl(url: string): boolean {
        // test the default form
        let contentRegex = new RegExp(this.defaultContentRegexString);
        if (contentRegex.test(url)) {
            return true;
        }
        // test the subdomain form
        contentRegex = new RegExp(this.subdomainContentRegexString);
        if (contentRegex.test(url)) {
            return true;
        }
        // test the short form
        contentRegex = new RegExp(this.shortContentRegexString);
        if (contentRegex.test(url)) {
            return true;
        }
        // url doesn't match any content form
        return false;
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    // override base class implementation to handle two url forms
    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed Medium account URL');
        }

        // extract the account name from the Medium account URL

        // test the default form
        let accountRegex = new RegExp(this.defaultAccountRegexString);
        let match = accountRegex.exec(url);
        if (match && match.groups && match.groups.accountName) {
            return {
                url: `${this.CanonicalHostname}/@${match.groups.accountName}`,
                account: match.groups.accountName
            }
        }

        // test the subdomain form
        accountRegex = new RegExp(this.subdomainFormRegexString);
        match = accountRegex.exec(url);
        if (match && match.groups && match.groups.accountName) {
            return {
                url: `https://${match.groups.accountName}.medium.com`,
                account: match.groups.accountName
            }
        }

        // url doesn't match either account form
        const errMsg = `Malformed Medium account URL: can't extract account name`;
        console.error(`canonicalizeAccountUrl: ${errMsg}`);
        throw new Error(errMsg);
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed Medium content URL');
        }

        // extract the storyID and accountName (if available) from the Medium content URL

        // test the default form
        let contentRegex = new RegExp(this.defaultContentRegexString);
        let match = contentRegex.exec(url);
        if (match && match.groups && match.groups.storyID && match.groups.title && match.groups.accountName) {
            return {
                account: match.groups.accountName,
                puid: match.groups.storyID,
                type: 'post',
                url: `${this.CanonicalHostname}/@${match.groups.accountName}/${match.groups.title}-${match.groups.storyID}`
            }
        }

        // test the subdomain form
        contentRegex = new RegExp(this.subdomainContentRegexString);
        match = contentRegex.exec(url);
        if (match && match.groups && match.groups.storyID && match.groups.title && match.groups.accountName) {
            return {
                account: match.groups.accountName,
                puid: match.groups.storyID,
                type: 'post',
                url: `https://${match.groups.accountName}.medium.com/${match.groups.title}-${match.groups.storyID}`
            }
        }

        // test the short form
        contentRegex = new RegExp(this.shortContentRegexString);
        match = contentRegex.exec(url);
        if (match && match.groups && match.groups.storyID) {
            return {
                account: '',
                puid: match.groups.storyID,
                type: 'post',
                url: `${this.CanonicalHostname}/p/${match.groups.storyID}`
            }
        }

        // url doesn't match any content form
        const errMsg = `Malformed Medium content URL`;
        console.error(`canonicalizeContentUrl: ${errMsg}`);
        throw new Error(errMsg);
    }

    // TODO: implement getAccountData and getContentData
}

// TikTok platform implementation.
export class TikTok extends Platform {

    constructor() {
        super('TikTok', 'https://www.tiktok.com',
            `@${ACCOUNT_STR}`, `@${ACCOUNT_STR}/video/${PUID_STR}`, 
            false, false,
            // matches TikTok URLs, with or without a www. subdomain
            "^https?://(?:www\\.)?(tiktok\\.com)",
            // matches TikTok account URLs with a '@' prefix
            `/@(?<accountName>[a-zA-Z0-9\\._]{1,24})\/?(?:\\?.*)?$`,
            // matches TikTok content URLs with a status path and a status ID path
            `/@?(?<accountName>[a-zA-Z0-9_]{1,15})/video/(?<puid>\\d{1,19})\/?(?:\\?.*)?$`
        );
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    filterType = (type: string | undefined): ContentType => 'video';
}

// LinkedIn platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class LinkedIn extends Platform {

    constructor() {
        super('LinkedIn', 'https://www.linkedin.com',
            '', '', // we don't use the base class implementation
            false, false,
            // matches LinkedIn URLs, with or without a subdomain
            "^https?://(?:[a-zA-Z0-9-]+\\.)?(linkedin\\.com)",
            // matches LinkedIn account URLs (either in/, company/, or school/ subpaths)
            '/(?<accountType>in|company|school)/(?<accountName>[^/]+)(?:\/about)?\/?(?:\\?.*)?$',
            // matches LinkedIn content URLs  
            `/(?!in/|school/|company/)(?<type>[a-zA-Z0-9-]+)/(?<title>[a-zA-Z0-9-_]+)?\/?(?:/|\\?.*)?$`
        );
    }

    filterType(liContentTypes: string): ContentType {
        switch (liContentTypes) {
            case 'posts':
                return 'post';
            case 'events':
                return 'event';
            case 'learning':
            case 'pulse':
            default:
                return 'misc';
        }
    }

    // overwrites the base implementation (TODO: fold into base implementation? would require adding accountType handling)
    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed LinkedIn account URL');
        }
        // extract the account name from the LinkedIn account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            const type = match.groups.accountType;
            let url = `${this.CanonicalHostname}/${type}/${accountName}/`;
            return {
                url: url,
                account: accountName
            }
        } else {
            const errMsg = `Malformed LinkedIn account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed LinkedIn content URL');
        }
        // extract the type from the LinkedIn content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const type = match.groups.type;
            const title = match.groups.title;
            return {
                account: '',
                puid: '',
                type: this.filterType(type),
                url: `${this.CanonicalHostname}/${type}/${title}/`
            }
        } else {
            const errMsg = `Malformed LinkedIn content URL`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }
}

// Threads platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class Threads extends Platform {

    constructor() {
        super('Threads', 'https://www.threads.net',
            `@${ACCOUNT_STR}`, `@${ACCOUNT_STR}/post/${PUID_STR}`,
            false, false,
            // matches Threads URLs, with or without a www. subdomain
            "^https?://(?:www\\.)?threads\\.net",
            // matches Threads account URLs, with an optional '@' prefix (gets added by redirect)
            "/@?(?<accountName>[^/]{1,30})\/?(?:\\?.*)?$",
            // matches Threads content URLs with a status path and a status ID path
            "/@?(?<accountName>[^/]{1,30})/post/(?<puid>[a-zA-Z0-9-_]+)\/?(?:\\?.*)?$"
        );
    }

    canonicalizeAccountName = trimAndRemoveAtPrefix;

    filterType = (type: string | undefined): ContentType => 'post';
}

// GoogleScholar platform implementation. This platform only supports account listing.
export class GoogleScholar extends Platform {

    constructor() {
        super('Google Scholar', 'https://scholar.google.com',
            `citations?user=${ACCOUNT_STR}`, ``, // no content URL for Google Scholar
            false, // access is public, but Google Scholar doesn't allow custom content, so nothing to retrieve
            false, // n/a
            // matches GoogleScholar URLs
            '^https?://scholar\\.google\\.com',
            // matches GoogleScholar account URLs
            '/citations\\?(?:[^&]*&)*user=(?<accountName>[a-zA-Z0-9-_]+)(?:&[^ ]*)?$',
            // no content URL for Google Scholar 
            ``
        );
    }

    // overwrite base class's implementation
    isValidContentUrl(url: string): boolean {
        return false; // Google Scholar does not support content URLs
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        throw new Error('Google Scholar does not support content URLs');
    }
}

// Rumble platform implementation.
export class Rumble extends Platform {
    constructor() {
        super('Rumble', 'https://rumble.com',
            `c/${ACCOUNT_STR}`, `${PUID_STR}.html`,
            true, true,
            // matches Rumble URLs, with or without www. subdomain
            "^https?://(?:www\\.)?(rumble\\.com)",
            // matches Rumble channel URLs  /c is optional.
            //'(?<accountName>\/?(c\/)?(c-\\d{7}|(?<!c-)\\w+))\/?$', // TODO remove old
            '/(c\/)?(?<accountName>(c-\\d{7}|(?<!c-)\\w+))(?:\/about)?\/?$',
            // matches Rumble content URLs
            '/(?<puid>[a-zA-Z0-9-_]+)(\\.html)?\/?$'
        );
    }

    canonicalizeAccountName = (url: string): string => {
        return trimAndRemoveAtPrefix(url).replace(/\/?(c\/)?/, '')
    };

    filterType = (type: string | undefined): ContentType => 'video';

    async getAccountData(url: string): Promise<PlatformAccountData> {
        const accountData = this.canonicalizeAccountUrl(url);
        try {
            const description = await query(`${accountData.url}/about`, 'div.channel-about-description-socials') as string;
            const xpocUri = findXpocUri(description);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: accountData.url,
                account: accountData.account
            };

        } catch (err) {
            throw new Error('Failed to fetch Rumble data');
        }
    }

    async getContentData(url: string): Promise<PlatformContentData> {
        const contentData = this.canonicalizeContentUrl(url);
        try {
            const channelUrl = await query(contentData.url, 'meta[property="og:url"]', 'content') as string;
            const account = (await query(contentData.url, 'a.media-by--a', 'href') as string)?.replace('/c/', '');
            const postTime = await query(contentData.url, '.media-description-info-tag > div', 'title') as string;
            const videoTag = await query(contentData.url, 'meta[property="og:video:tag"]', 'content') as string;

            const xpocUri = findXpocUri(videoTag);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: contentData.url,
                account: account,
                timestamp: toUTCString(postTime),
                puid: contentData.puid
            };
        } catch (err) {
            throw new Error('Failed to fetch Rumble data');
        }
    }
}

// GitHub platform implementation. This platform only supports account listing.
export class GitHub extends Platform {

    constructor() {
        super('GitHub', 'https://github.com',
        `${ACCOUNT_STR}`, `TODO`,
        true,
        false, // n/a
        // matches GitHub URLs
        '^https?://(?:www\\.)?(github\\.com)',
        // matches GitHub account URLs
        "/(?<accountName>[a-zA-Z0-9-_]{1,39})\/?(?:\\?.*)?$",
        // no content URL for GitHub 
        ``
        );
    }

    // overwrite base class's implementation
    isValidContentUrl(url: string): boolean {
        return false; // GitHub does not support content URLs
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        throw new Error('GitHub does not support content URLs');
    }

    async getAccountData(url: string): Promise<PlatformAccountData> {
        // TODO: same implementation as YouTube's; refactor
        const accountData = this.canonicalizeAccountUrl(url);
        try {
            const description = await query(accountData.url, 'meta[name="description"]', 'content') as string;
            const xpocUri = findXpocUri(description);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: accountData.url,
                account: accountData.account
            };

        } catch (err) {
            throw new Error('Failed to fetch GitHub data');
        }
    }
}

// supported platforms
export const Platforms = {

    platforms: [
        new YouTube(),
        new XTwitter(),
        new Facebook(),
        new Instagram(),
        new Medium(),
        new TikTok(),
        new LinkedIn(),
        new Threads(),
        new GoogleScholar(),
        new Rumble(),
        new GitHub()
    ],

    /**
     * Returns true if the platform is supported, false otherwise.
     * @param platform the platform to check.
     */
    isSupportedPlatform(platform: string): boolean {
        const lcPlatform = platform.trim().toLowerCase();
        for (const platform of Platforms.platforms) {
            if (platform.DisplayName.toLowerCase() === lcPlatform) {
                return true;
            }
        }
        return false;
    },

    /**
     * Returns the canonical platform name (if the platform is supported) or the unchanged input value (otherwise).
     * @param platform the platform to canonicalize.
     */
    getCanonicalPlatformName(platform: string): string {
        const lcPlatform = platform.trim().toLowerCase();
        for (const platform of Platforms.platforms) {
            if (platform.DisplayName.toLowerCase() === lcPlatform) {
                return platform.DisplayName;
            }
        }
        return platform;
    },

    /**
     * Returns the platform object for a given platform name.
     * @param platform the platform name.
     */
    getPlatform(platform: string): Platform {
        const lcPlatform = platform.trim().toLowerCase();
        for (const platform of Platforms.platforms) {
            if (platform.DisplayName.toLowerCase() === lcPlatform) {
                return platform;
            }
        }
        throw new Error(`Unsupported platform: ${platform}`);
    },

    /**
     * Checks if a URL is an account URL from a supported platform.
     * @param url URL to check.
     */
    isSupportedAccountUrl(url: string): boolean {
        for (const platform of Platforms.platforms) {
            if (platform.isValidAccountUrl(url)) {
                return true;
            }
        }
        return false;
    },

    /**
     * Checks if account data can be retrieved from the URL. If so,
     * getAccountFromUrl() can be called.
     * @param url URL to check.
     * @returns true if account data can be retrieved from the URL.
     */
    canFetchAccountFromUrl(url: string): boolean {
        for (const platform of Platforms.platforms) {
            if (platform.isValidAccountUrl(url) && platform.CanFetchAccountData) {
                return true;
            }
        }
        return false;
    },

    /**
     * Returns the account data for a given account URL on a supported platform.
     * @param url URL to extract account data from.
     * @returns account data.
     */
    async getAccountFromUrl(url: string): Promise<PlatformAccountData> {
        for (const platform of Platforms.platforms) {
            if (platform.isValidAccountUrl(url)) {
                return await platform.getAccountData(url);
            }
        }
        throw new Error(`Unsupported platform: ${url}`);
    },

    /**
     * Checks if a URL is a content URL from a supported platform.
     * @param url URL to check.
     * @returns true if the URL is a supported platform content URL.
     */
    isSupportedContentUrl(url: string): boolean {
        for (const platform of Platforms.platforms) {
            if (platform.isValidContentUrl(url)) {
                return true;
            }
        }
        return false;
    },

    /**
     * Checks if content data can be retrieved from the URL. If so,
     * getContentFromUrl() can be called.
     * @param url URL to check.
     * @returns true if content data can be retrieved from the URL.
     */
    canFetchContentFromUrl(url: string): boolean {
        for (const platform of Platforms.platforms) {
            if (platform.isValidContentUrl(url) && platform.CanFetchContentData) {
                return true;
            }
        }
        return false;
    },

    /**
     * Returns the content data for a given content URL on a supported platform.
     * @param url URL to extract content data from.
     * @returns content data.
     */
    async getContentFromUrl(url: string): Promise<PlatformContentData> {
        for (const platform of Platforms.platforms) {
            if (platform.isValidContentUrl(url)) {
                return await platform.getContentData(url);
            }
        }
        throw new Error(`Unsupported platform: ${url}`);
    }

}