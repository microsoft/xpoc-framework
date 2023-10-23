// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'fs';
import { Platforms } from './platform.js';
import { Manifest as validateManifest } from './manifest.schema.js'
import { ValidateFunction } from 'ajv';

/**
 * A platform account.
 */
export type Account = {
    account: string;
    platform: string;
    url?: string;
};

/**
 * A platform content item.
 */
export type ContentItem = {
    account: string;
    platform: string;
    url: string;
    desc?: string;
    puid?: string;
    timestamp?: string;
};

/**
 * A XPOC manifest.
 */
export type XPOCManifest = {
    name: string;
    baseurl: string;
    updated?: string;
    version: string;
    accounts: Account[];
    content: ContentItem[];
};

/**
 * Values to match an account in a manifest.
 */
export type AccountMatchValues = {
    account?: string;
    platform?: string;
    url?: string;
}

/**
 * Values to match a content item in a manifest.
 */
export type ContentMatchValues = {
    account?: string;
    platform?: string;
    url?: string;
    puid?: string;
}

/**
 * Returns true if the two resources referenced by two URLs are the same.
 */
const areResourcesEqual = (url1: string | undefined, url2: string | undefined): boolean => {
    if (!url1 || !url2) return false;
    // trim the URLs to remove any whitespace, the http(s):// prefix, and trailing slashes
    const trimUrl = (url: string): string => url.trim().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    return trimUrl(url1) === trimUrl(url2);
}

/**
 * XPOC manifest class (without fs operations for browser export).
 */
export class ManifestBase {
    manifest: XPOCManifest;
    static LatestVersion = '0.3';

    constructor(manifest: XPOCManifest) {
        this.manifest = manifest;
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
     * Returns all accounts matching any of the provided values.
     * @param amv the account matching values.
     * @returns array of matching accounts.
     */
    matchAccount(amv: AccountMatchValues): Account[] {
        const result: Account[] = [];
        if (amv) {
            if (amv.account) {
                for (let account of this.manifest.accounts) {
                    let canonicalAccountName = amv.account.trim(); // fallback value for unsupported platforms
                    if (Platforms.isSupportedPlatform(account.platform)) {
                        const platform = Platforms.getPlatform(account.platform);
                        if (platform) {
                            canonicalAccountName = platform.canonicalizeAccountName(amv.account);
                        }
                    }
                    if (account.account === canonicalAccountName) {
                        result.push(account);
                    }
                }
            }
            if (amv.platform) {
                const canonicalPlatform = Platforms.getCanonicalPlatformName(amv.platform);
                const matches = this.manifest.accounts.filter(account => account.platform === canonicalPlatform);
                result.push(...matches);
            }
            if (amv.url) {
                let canonicalUrl = amv.url.trim(); // fallback value for unsupported platforms
                for (let account of this.manifest.accounts) {
                    // get the canonical version of the URL for supported versions
                    if (Platforms.isSupportedPlatform(account.platform)) {
                        const platform = Platforms.getPlatform(account.platform);
                        if (platform) {
                            if (platform.isValidAccountUrl(amv.url)) {
                                canonicalUrl = platform.canonicalizeAccountUrl(amv.url).url;
                            }
                        }
                    }
                    if (areResourcesEqual(account.url, canonicalUrl)) {
                        result.push(account);
                    }
                }
            }
        }
        return result;
    }

    /**
     * Returns all content matching any of the provided values.
     * @param amv the content matching values.
     * @returns array of matching content.
     */
    matchContent(cmv: ContentMatchValues): ContentItem[] {
        const result: ContentItem[] = [];
        if (cmv) {
            if (cmv.account) {
                for (let content of this.manifest.content) {
                    let canonicalAccountName = cmv.account.trim(); // fallback value for unsupported platforms
                    if (Platforms.isSupportedPlatform(content.platform)) {
                        const platform = Platforms.getPlatform(content.platform);
                        if (platform) {
                            canonicalAccountName = platform.canonicalizeAccountName(cmv.account);
                        }
                    }
                    if (content.account === canonicalAccountName) {
                        result.push(content);
                    }
                }
            }
            if (cmv.platform) {
                const canonicalPlatform = Platforms.getCanonicalPlatformName(cmv.platform);
                const matches = this.manifest.content.filter(content => content.platform === canonicalPlatform);
                result.push(...matches);
            }
            if (cmv.url) {
                let canonicalUrl = cmv.url.trim(); // fallback value for unsupported platforms
                for (let content of this.manifest.content) {
                    // get the canonical version of the URL for supported versions
                    if (Platforms.isSupportedPlatform(content.platform)) {
                        const platform = Platforms.getPlatform(content.platform);
                        if (platform) {
                            if (platform.isValidContentUrl(cmv.url)) {
                                canonicalUrl = platform.canonicalizeContentUrl(cmv.url).url;
                            }
                        }
                    }
                    if (areResourcesEqual(content.url, canonicalUrl)) {
                        result.push(content);
                    }
                }
            }
            if (cmv.puid) {
                // compare PUIDs as-is
                const searchPuid = cmv.puid.trim();
                const matches = this.manifest.content.filter(content => content.puid === searchPuid);
                result.push(...matches);
            }
        }
        return result;
    }

    static validate(manifest: XPOCManifest): { valid: boolean, errors?: string[] } {
        const validateFunction = validateManifest as ValidateFunction;
        const valid = validateFunction(manifest)
        if (valid) return { valid: true };
        const errors: string[] = validateFunction.errors?.map((err) => `${err.instancePath}: ${err.message}` ?? '') ?? [];
        return { valid: false, errors };
    }
}

/**
 * XPOC manifest class.
 */
export class Manifest extends ManifestBase {
    /**
     * Loads a manifest from a file.
     * @param path path to the file to load.
     * @returns a manifest.
     */
    static loadFromFile(path: string): Manifest {
        return new Manifest(
            JSON.parse(fs.readFileSync(path, 'utf8')) as XPOCManifest,
        );
    }

    /**
     * Saves the manifest to a file.
     * @param path path to the file.
     */
    saveToFile(path: string): void {
        fs.writeFileSync(path, JSON.stringify(this.manifest, null, 4));
    }
}

