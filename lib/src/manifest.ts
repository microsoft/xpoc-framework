// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'fs';
import { Platform, XTwitter, YouTube, Facebook, Instagram, Medium} from './platform';

/**
 * A platform account.
 */
export type Account = {
    platform: string,
    url: string,
    account: string;
}

/**
 * A platform content item.
 */
export type ContentItem = {
    title?: string;
    desc?: string;
    url: string;
    platform: string;
    puid?: string;
    account: string;
    timestamp?: string;
};

/**
 * A XPOC manifest.
 */
export type XPOCManifest = {
    name: string;
    baseurl: string;
    version: string;
    accounts: Account[];
    content: ContentItem[];
};

const platforms: Platform[] = [
    new YouTube(),
    new XTwitter(),
    new Facebook(),
    new Instagram(),
    new Medium()
];

/**
 * XPOC manifest class.
 */
export class Manifest {
    manifest: XPOCManifest;
    static LatestVersion = '0.1.1';

    constructor(manifest: XPOCManifest) {
        this.manifest = manifest;
    }

    /**
     * Loads a manifest from a file.
     * @param path path to the file to load.
     * @returns a manifest.
     */
    static loadFromFile(path: string): Manifest {
        return new Manifest(JSON.parse(fs.readFileSync(path, 'utf8')) as XPOCManifest);
    }

    /**
     * Saves the manifest to a file.
     * @param path path to the file.
     */
    saveToFile(path: string): void {
        fs.writeFileSync(path, JSON.stringify(this.manifest, null, 4));
    }

    /**
     * Adds an account to the manifest.
     * @param account Account to add.
     */
    addAccount(account: Account): void {
        this.manifest.accounts.push(account);
    }

    /**
     * Adds a content item to the manifest.
     * @param contentItem Content item to add.
     */
    addContentItem(contentItem: ContentItem): void {
        this.manifest.content.push(contentItem);
    }

    /**
     * Checks if a URL is an account URL from a supported platform.
     * @param url URL to check.
     * @returns true if the URL is a supported platform account URL.
     */
    static isSupportedAccountUrl(url: string): boolean {
        for (const platform of platforms) {
            if (platform.isValidAccountUrl(url)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if account data can be retrieved from the URL. If so,
     * getAccountFromUrl() can be called.
     * @param url URL to check.
     * @returns true if account data can be retrieved from the URL.
     */
    static canFetchAccountFromUrl(url: string): boolean {
        for (const platform of platforms) {
            if (platform.isValidAccountUrl(url) && platform.CanFetchAccountData) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the account data for a given account URL on a supported platform.
     * @param url URL to extract account data from.
     * @returns account data.
     */
    static async getAccountFromUrl(url: string): Promise<Account> {
        for (const platform of platforms) {
            if (platform.isValidAccountUrl(url)) {
                const accountData = await platform.getAccountData(url);
                return {
                    platform: platform.DisplayName,
                    url: accountData.url,
                    account: accountData.account
                };
            }
        }
        throw new Error(`Unsupported platform: ${url}`);
    }

   /**
     * Checks if a URL is a content URL from a supported platform.
     * @param url URL to check.
     * @returns true if the URL is a supported platform content URL.
     */
   static isSupportedContentUrl(url: string): boolean {
        for (const platform of platforms) {
            if (platform.isValidContentUrl(url)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if content data can be retrieved from the URL. If so,
     * getContentFromUrl() can be called.
     * @param url URL to check.
     * @returns true if content data can be retrieved from the URL.
     */
    static canFetchContentFromUrl(url: string): boolean {
        for (const platform of platforms) {
            if (platform.isValidContentUrl(url) && platform.CanFetchContentData) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the content data for a given content URL on a supported platform.
     * @param url URL to extract content data from.
     * @returns content data.
     */
    static async getContentFromUrl(url: string): Promise<ContentItem> {
        for (const platform of platforms) {
            if (platform.isValidContentUrl(url)) {
                const contentData = await platform.getContentData(url);
                return {
                    timestamp: contentData.timestamp,
                    url: contentData.url,
                    platform: contentData.platform,
                    puid: contentData.puid,
                    account: contentData.account
                };
            }
        }
        throw new Error(`Unsupported platform: ${url}`);
    }
}