// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'fs';

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

/**
 * XPOC manifest class.
 */
export class Manifest {
    manifest: XPOCManifest;
    static LatestVersion = '0.1.2';

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
}