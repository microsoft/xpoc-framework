// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'fs';

/**
 * A platform account.
 */
export type Account = {
    account: string;
    platform: string;
    url: string;
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
    version: string;
    accounts: Account[];
    content: ContentItem[];
};

/**
 * XPOC manifest class (without fs operations for browser export).
 */
export class ManifestBase {
    manifest: XPOCManifest;
    static LatestVersion = '0.1.2';

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
