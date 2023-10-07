// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Manifest, XPOCManifest, AccountMatchValues, ContentMatchValues } from './manifest';

describe('manifest file operations', () => {
    let manifest: Manifest;
    test('manifest creation', () => {
        const xpocManifest: XPOCManifest = {
            name: 'test',
            baseurl: 'example.com',
            version: Manifest.LatestVersion,
            accounts: [
                {
                    account: 'abc',
                    platform: 'test',
                    url: 'https://platform.test/abc'
                }
            ],
            content: [
                {
                    account: 'test',
                    platform: 'test',
                    url: 'https://platform.test/xyz',
                    desc: 'test',
                    puid: 'xyz',
                    timestamp: '2020-01-01T00:00:00Z'
                }
            ]
        };
        manifest = new Manifest(xpocManifest);
    });

    test('add account', () => {
        manifest.addAccount({
            account: 'def',
            platform: 'test',
            url: 'https://platform.test/def'
        });
        expect(manifest.manifest.accounts.length).toBe(2);
    });

    test('add content', () => {
        manifest.addContentItem({
            account: 'test2',
            platform: 'test',
            url: 'https://platform.test/uvw',
            desc: 'test2',
            puid: 'uvw',
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

    let testManifest = Manifest.loadFromFile('./testdata/testmanifest.json');
    test('load manifest from file', () => {
        // sanity check
        expect(testManifest).toBeDefined();
        expect(testManifest?.manifest.name).toBe('A test name');
        expect(testManifest?.manifest.version).toBe(Manifest.LatestVersion);
        expect(testManifest?.manifest.accounts.length).toBe(11);
        expect(testManifest?.manifest.content.length).toBe(9);
    });
    
    (testManifest ? test : test.skip)('match accounts', () => {
        // search using each parameter (values will be canonicalized)
        const searchValues: AccountMatchValues[] = [
            {account: "@a_ig_test_account "},
            {platform: "instagram"},
            {url: "https://www.instagram.com/a_ig_test_account"}
        ]
        for (const searchValue of searchValues) {
            const accounts = testManifest?.matchAccount(searchValue);
            expect(accounts?.length).toBe(1);
            if (accounts) {
                const account = accounts[0];
                expect(account.account).toBe('a_ig_test_account');
                expect(account.platform).toBe('Instagram');
                expect(account.url).toBe('https://www.instagram.com/a_ig_test_account/');
            }
        }
    });

    (testManifest ? test : test.skip)('match content', () => {
        // search using each parameter (values will be canonicalized)
        const searchValues: ContentMatchValues[] = [
            {account: "@a_ig_test_account "},
            {platform: "instagram"},
            {url: "https://www.instagram.com/p/ABCDE12345/"},
            {puid: "ABCDE12345"}
        ]
        for (const searchValue of searchValues) {
            const contents = testManifest?.matchContent(searchValue);
            expect(contents?.length).toBe(1);
            if (contents) {
                const content = contents[0];
                expect(content.account).toBe('a_ig_test_account');
                expect(content.platform).toBe('Instagram');
                expect(content.url).toBe('https://www.instagram.com/p/ABCDE12345/');
            }
        }
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
        try {
            await fs.unlink(tmpFilePath); // delete the file
            await fs.rmdir(tmpDir);
        } catch (err) {
            // ignore errors
        }
    });
});
