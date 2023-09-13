// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from 'axios';
import {load} from 'cheerio';

export type ContentType = 'post' | 'photo' | 'video' | 'reel' | 'misc';

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

export abstract class Platform {
    // the platform's display name
    public DisplayName: string;

    // canonical hostname
    public CanonicalHostname: string;

    // returns true if the platform is accessible (either publicly, or through pre-configured API access)
    // if true, @see getAccountData and @see getContentData can be called
    public CanFetchData: boolean;

    // regex strings used to validate and canonicalize hostname URLs
    protected regexHostnameString: string;

    // regex strings used to validate and canonicalize account URLs
    protected accountRegexString: string;

    // regex strings used to validate and canonicalize content URLs
    protected contentRegexString: string;

    constructor(displayName: string, canonicalHostname: string, canFetchData: boolean,
                regexHostnameString: string, accountRegexStringSuffix: string, contentRegexStringSuffix: string) {
        this.DisplayName = displayName;
        this.CanonicalHostname = canonicalHostname;
        this.CanFetchData = canFetchData;
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

    // transforms an account URL into the platform's canonical form
    abstract canonicalizeAccountUrl(url: string): CanonicalizedAccountData;

    // transforms a content URL into the platform's canonical form
    abstract canonicalizeContentUrl(url: string): CanonicalizedContentData;

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
const findXpocUri = (text:string | undefined) => {
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

// TODO: make sure all regex ignore the case of the hostname

// YouTube platform implementation. This implementation fetches YouTube URLs directly.
// An alternate implementation could make use of the YouTube API, which would require
// an API key and a Google account.
export class YouTube extends Platform {
    constructor() {
        super('YouTube', 'https://www.youtube.com', true,
            // matches YouTube URLs, with or without www. or m. subdomains
            "^https?://(?:www\\.|m\\.)?(youtube\\.com|youtu\\.be)",
            // matches YouTube account URLs, with an optional 'about/' path
            `/@(?<accountName>[^/]+)(/about)?/?$`,
            // matches YouTube content URLs with a watch path and a 'v' query parameter
            `/watch\\?(?:[^&]*&)*v=(?<videoID>[\\w-]{11})(?:&[^ ]*)?$`
        );
    }
   
    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed YouTube account URL');
        }
        // extract the @account name from the YouTube account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            return {
                url: `${this.CanonicalHostname}/@${accountName}/about`,
                account: accountName
            }
        } else {
            const errMsg = `Malformed YouTube account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed YouTube content URL');
        }
        // extract the video ID from the YouTube content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const videoID = match.groups.videoID;
            return {
                account: '',
                puid: videoID,
                type: 'video',
                url: `${this.CanonicalHostname}/watch?v=${videoID}`
            }
        } else {
            const errMsg = `Malformed YouTube content URL: can't extract video ID`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    async getAccountData(url: string): Promise<PlatformAccountData> {
        const accountData = this.canonicalizeAccountUrl(url);
        try {
            const response = await axios.get(accountData.url);
            const $ = load(response.data);
            const description = $('meta[name="description"]').attr('content');
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
            const response = await axios.get(contentData.url);
            const $ = load(response.data);
            const channelUrl = $('span[itemprop="author"] link[itemprop="url"]').attr('href');
            const account = channelUrl?.split('/').pop()?.replace('@', '') || '';
            const postTime = $('meta[itemprop="datePublished"]').attr('content') || '';
            const videoDescription = $('meta[name="description"]').attr('content');
            const xpocUri = findXpocUri(videoDescription);
            return {
                xpocUri: xpocUri,
                platform: this.DisplayName,
                url: contentData.url,
                account: account,
                timestamp: postTime ? postTime+"T00:00:00Z" : '',
                puid: contentData.puid
            };
        } catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    }
}

// X/Twitter platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class XTwitter extends Platform {

    constructor() {
        super('X/Twitter', 'https://twitter.com', false,
        // matches X/Twitter URLs, with or without a www. subdomain (TODO: is the www. subdomain ever used?)
        "^https?://(?:www\\.)?(twitter\\.com|x\\.com)",
        // matches X/Twitter account URLs, with an optional '@' prefix (gets removed by redirect)
        `/@?(?<accountName>[a-zA-Z0-9_]{1,15})$`,
        // matches X/Twitter content URLs with a status path and a status ID path
        `/@?(?<accountName>[a-zA-Z0-9_]{1,15})/status/(?<statusID>\\d{1,19})$`
        );
    }

    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed X/Twitter account URL');
        }
        // extract the account name from the X/Twitter account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            return {
                url: `${this.CanonicalHostname}/${accountName}`,
                account: accountName
            }
        } else {
            const errMsg = `Malformed X/Twitter account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed X/Twitter content URL');
        }
        // extract the status ID from the X/Twitter content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            const statusID = match.groups.statusID;
            return {
                account: accountName,
                puid: statusID,
                type: 'post',
                url: `${this.CanonicalHostname}/${accountName}/status/${statusID}`
            }
        } else {
            const errMsg = `Malformed X/Twitter content URL: can't extract status ID`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }
}

// Facebook platform implementation. This implementation does not fetch account
// and content URLs; this requires API access.
export class Facebook extends Platform {

    constructor() {
        super('Facebook', 'https://www.facebook.com', false,
        // matches Facebook URLs, with or without www. or m. subdomains
        `^https?://(?:www\\.|m\\.)?(facebook\\.com|fb\\.com)`,
        // matches Facebook account URLs, with an optional 'about/' path
        `/(?<accountName>[^/]+)(/about)?/?$`, // TODO: ignore query parameters and anchors
        // matches Facebook content URLs (posts/photos/videos/reels), either with a account name path of a fbid query parameter
        // TODO: Facebook has many types of valid content URLs, this could be improved 
        `/(?:(?<accountName>\\w+)/(?:(?<contentType>posts|photos|videos|reels)/)|(?<contentType2>post|photo|video|reel)\\?.*?fbid=(?<fbid>\\d+))`
        );
    }

    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed Facebook account URL');
        }
        // extract the account name from the Facebook account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            return {
                url: `${this.CanonicalHostname}/${accountName}`,
                account: accountName
            }
        } else {
            const errMsg = `Malformed Facebook account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    fbContentTypesToContentType(fbContentTypes: string): ContentType {
        switch (fbContentTypes) {
            case 'posts':
            case 'post' :
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
                type: this.fbContentTypesToContentType(contentType),
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
        super('Instagram', 'https://www.instagram.com', false,
        // matches Instagram URLs, with or without www. or m. subdomains
        `^https?://(?:www\\.|m\\.)?(instagram\\.com)`,
        // matches Instagram account URLs
        `/(?<accountName>[^/]+)/?$`, // TODO: ignore query parameters and anchors
        // matches Instagram content URLs (a post or reel)
        `/(?<contentType>p|reel)/(?<id>[a-zA-Z0-9_-]+)/?(?:\\?.*?)?$`
        );
    }

    canonicalizeAccountUrl(url: string): CanonicalizedAccountData {
        if (!this.isValidAccountUrl(url)) {
            throw new Error('Malformed Instagram account URL');
        }
        // extract the account name from the Instagram account URL
        const accountRegex = new RegExp(this.accountRegexString);
        const match = accountRegex.exec(url);
        if (match && match.groups) {
            const accountName = match.groups.accountName;
            return {
                url: `${this.CanonicalHostname}/${accountName}/`, // IG always redirects to URL terminating with a slash
                account: accountName
            }
        } else {
            const errMsg = `Malformed Instagram account URL: can't extract account name`;
            console.error(`canonicalizeAccountUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }

    igContentTypesToContentType(igContentTypes: string): ContentType {
        switch (igContentTypes) {
            case 'p':
                return 'post';
            case 'reel':
                return 'reel';
            default:
                return 'misc';
        }
    }

    canonicalizeContentUrl(url: string): CanonicalizedContentData {
        if (!this.isValidContentUrl(url)) {
            throw new Error('Malformed Instagram content URL');
        }
        // extract what we can from the Instagram content URL
        const contentRegex = new RegExp(this.contentRegexString);
        const match = contentRegex.exec(url);
        if (match && match.groups) {
            const id = match.groups.id;
            const contentType = match.groups.contentType;
            let canonicalUrl = `${this.CanonicalHostname}/${contentType}/${id}/`;
            return {
                account: '',
                puid: id,
                type: this.igContentTypesToContentType(contentType),
                url: canonicalUrl
            }
        } else {
            const errMsg = `Malformed Instagram content URL`;
            console.error(`canonicalizeContentUrl: ${errMsg}`);
            throw new Error(errMsg);
        }
    }    
}

// Medium platform implementation.
export class Medium extends Platform {
    // account regex (default form) - matches https://medium.com/@accountName with optional /about path and query params
    private defaultAccountRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/@(?<accountName>[^\/?]+)(?:\/about)?\/?(?:\\?.*)?$';
    // account regex (subdomain form) - matches https://accountName.medium.com with optional /about path and query params
    private subdomainFormRegexString = '^https?:\/\/(?<accountName>[^\.]+)\\.medium\\.com(?:\/about)?\/?(?:\\?.*)?$';

    // content regex (default form) - matches https://medium.com/@accountName/title-storyID with optional query params  
    private defaultContentRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/@(?<accountName>[^\/]+)\/(?<title>[^\/]+)-(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';
    // content regex (subdomain form) - matches https://accountName.medium.com/title-storyID with optional query params
    private subdomainContentRegexString = '^https?:\/\/(?<accountName>[^.]+)\\.medium\\.com\/(?<title>[^\/]+)-(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';
    // content regex (short form) - matches https://medium.com/p/storyID with optional query params
    private shortContentRegexString = '^https?:\/\/(?:www\\.)?medium\\.com\/p\/(?<storyID>[a-fA-F0-9]+)\/?(?:\\?.*)?$';

    constructor() {
        super('Medium', 'https://medium.com',
            false, // some (most) stories are publicly available, so we could make that true (TODO)
            // not using the base class regexp strings, because of how Medium URLs are structured
            '', '', ''
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