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

describe('platform operations', () => {
    test('platform account URL validation', () => {
        // YouTube test
        expect(Manifest.isSuportedPlatformAccountUrl('https://www.youtube.com/@accountname/about')).toBe(true);
        // X/Twitter test
        expect(Manifest.isSuportedPlatformAccountUrl('https://twitter.com/accountname')).toBe(true);
        // Facebook test
        expect(Manifest.isSuportedPlatformAccountUrl('https://www.facebook.com/accountname')).toBe(true);
        // Instagram test
        expect(Manifest.isSuportedPlatformAccountUrl('https://www.instagram.com/accountname/')).toBe(true);
        // Medium test
        expect(Manifest.isSuportedPlatformAccountUrl('https://medium.com/@accountname')).toBe(true);
        // unsupported platform
        expect(Manifest.isSuportedPlatformAccountUrl('https://www.notaplatform.com/accountname')).toBe(false);
    });

    test('platform content URL validation', () => {
        // YouTube test
        expect(Manifest.isSuportedPlatformContentUrl('https://www.youtube.com/watch?v=abcdef12345')).toBe(true);
        // X/Twitter test
        expect(Manifest.isSuportedPlatformContentUrl('https://twitter.com/accountname/status/1234567890123456789')).toBe(true);
        // Facebook test
        expect(Manifest.isSuportedPlatformContentUrl('https://www.facebook.com/accountname/photos/123456789012345')).toBe(true);
        // Instagram test
        expect(Manifest.isSuportedPlatformContentUrl('https://www.instagram.com/p/ABCDEF12345/')).toBe(true);
        // Medium test
        expect(Manifest.isSuportedPlatformContentUrl('https://medium.com/@accountname/title-abcdef123456')).toBe(true);
        // unsupported platform
        expect(Manifest.isSuportedPlatformContentUrl('https://www.notaplatform.com/abc123')).toBe(false);
    });

    test('platform account URL extraction', async () => {
        // YouTube test
        const accountData = await Manifest.getAccountFromUrl('https://www.youtube.com/@christianpaquinmsr');
        expect(accountData.platform).toBe('YouTube');
        expect(accountData.account).toBe('christianpaquinmsr');
        expect(accountData.url).toBe('https://www.youtube.com/@christianpaquinmsr/about');

        // X/Twitter test (no public access, expect a not supported exception)
        await expect(Manifest.getAccountFromUrl('https://twitter.com/chpaquin')).rejects.toThrow();

        // Facebook test (no public access, expect a not supported exception)
        await expect(Manifest.getAccountFromUrl('https://facebook.com/Microsoft')).rejects.toThrow();

        // Instagram test (no public access, expect a not supported exception)
        await expect(Manifest.getAccountFromUrl('https://www.instagram.com/microsoft/')).rejects.toThrow();

        // Medium test (not yet implemented (TODO), expect a not supported exception)
        await expect(Manifest.getAccountFromUrl('https://medium.com/@chpaquin')).rejects.toThrow();

        // unsupported platform
        await expect(Manifest.getAccountFromUrl('https://www.notaplatform.com/accountname')).rejects.toThrow();
    });

    test('platform content URL extraction', async () => {
        // YouTube test
        const contentData = await Manifest.getContentFromUrl('https://www.youtube.com/watch?v=hDd3t7y1asU');
        expect(contentData.platform).toBe('YouTube');
        expect(contentData.puid).toBe('hDd3t7y1asU');
        expect(contentData.url).toBe('https://www.youtube.com/watch?v=hDd3t7y1asU');
        expect(contentData.account).toBe('christianpaquinmsr');
        expect(contentData.timestamp).toBe('2023-07-10T00:00:00Z');

        // X/Twitter test (no public access, expect a not supported exception)
        await expect(Manifest.getContentFromUrl('https://twitter.com/chpaquin/status/1694698274618319246')).rejects.toThrow();

        // Facebook test (no public access, expect a not supported exception)
        await expect(Manifest.getContentFromUrl('https://www.facebook.com/Microsoft/photos/a.10150199519298721/10150199519298721/')).rejects.toThrow();

        // Instagram test (no public access, expect a not supported exception)
        await expect(Manifest.getContentFromUrl('https://www.instagram.com/p/CQ7Z1Y1JZ1s/')).rejects.toThrow();

        // Medium test (not yet implemented (TODO), expect a not supported exception)
        await expect(Manifest.getContentFromUrl('https://medium.com/@chpaquin/xpoc-test-4fecf28be9a8')).rejects.toThrow();

        // unsupported platform
        await expect(Manifest.getContentFromUrl('https://www.notaplatform.com/abc123')).rejects.toThrow();
    });
});
