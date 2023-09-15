// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Manifest, XPOCManifest } from './manifest';

describe('manifest file operations', () => {
    let manifest: Manifest;
    test('manifest creation', () => {
        const xpocManifest: XPOCManifest = {
            name: 'test',
            baseurl: 'example.com',
            version: Manifest.LatestVersion,
            accounts: [
                {
                    platform: 'test',
                    url: 'https://platform.test/abc',
                    account: 'abc'
                }
            ],
            content: [
                {
                    title: 'test',
                    desc: 'test',
                    url: 'https://platform.test/xyz',
                    platform: 'test',
                    puid: 'xyz',
                    account: 'test',
                    timestamp: '2020-01-01T00:00:00Z'
                }
            ]
        };
        manifest = new Manifest(xpocManifest);
    });

    test('add account', () => {
        manifest.addAccount({
            platform: 'test',
            url: 'https://platform.test/def',
            account: 'def'
        });
        expect(manifest.manifest.accounts.length).toBe(2);
    });

    test('add content', () => {
        manifest.addContentItem({
            title: 'test2',
            desc: 'test2',
            url: 'https://platform.test/uvw',
            platform: 'test',
            puid: 'uvw',
            account: 'test2',
            timestamp: '2021-01-01T00:00:00Z'
        });
        expect(manifest.manifest.content.length).toBe(2);
    });
});

describe('manifest file operations', () => {
    // Path to our temporary directory and file
    const tmpDir = join(tmpdir(), 'xpoc_tmp');
    const tmpFilePath = join(tmpDir, 'testmanifest.json');

    // Before all tests, ensure the directory exists
    beforeAll(async () => {
        try {
            await fs.access(tmpDir, fs.constants.F_OK);
        } catch (err) {
            // Directory does not exist, create it
            await fs.mkdir(tmpDir);
        }
    });

    test('load manifest from file', () => {
        const manifest = Manifest.loadFromFile('./testdata/testmanifest.json');
        // sanity check
        expect(manifest.manifest.name).toBe('A test name');
        expect(manifest.manifest.version).toBe(Manifest.LatestVersion);
        expect(manifest.manifest.accounts.length).toBe(5);
        expect(manifest.manifest.content.length).toBe(5);
    });
    
    test('save manifest to file', async () => {
        const manifest = new Manifest({
            name: 'A test name',
            baseurl: 'example.com',
            version: Manifest.LatestVersion,
            accounts: [],
            content: []
        });

        // Save to the temp path
        manifest.saveToFile(tmpFilePath);

        const fileExists = await fs.access(tmpFilePath, fs.constants.F_OK);
        expect(fileExists).toBeUndefined(); // access does not return anything if the file exists, but throws an error if not
    });

    // clean up
    afterAll(async () => {
        await fs.unlink(tmpFilePath); // delete the file
        await fs.rmdir(tmpDir);
    });
});
