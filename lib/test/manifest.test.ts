// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
    Manifest,
    XPOCManifest,
    AccountMatchValues,
    ContentMatchValues,
} from '../src/manifest';
import { type FetchError } from '../src/fetch';

describe('manifest file operations', () => {
    let manifest: Manifest;
    test('manifest creation', () => {
        const xpocManifest: XPOCManifest = {
            name: 'test',
            baseurl: 'example.com',
            version: Manifest.LatestVersion,
            updated: '2023-10-23T00:00:00Z',
            accounts: [
                {
                    account: 'abc',
                    platform: 'test',
                    url: 'https://platform.test/abc',
                },
            ],
            content: [
                {
                    account: 'test',
                    platform: 'test',
                    url: 'https://platform.test/xyz',
                    desc: 'test',
                    puid: 'xyz',
                    timestamp: '2020-01-01T00:00:00Z',
                },
            ],
        };
        manifest = new Manifest(xpocManifest);
    });

    test('add account', () => {
        manifest.addAccount({
            account: 'def',
            platform: 'test',
            url: 'https://platform.test/def',
        });
        expect(manifest.manifest.accounts?.length).toBe(2);
    });

    test('add content', () => {
        manifest.addContentItem({
            account: 'test2',
            platform: 'test',
            url: 'https://platform.test/uvw',
            desc: 'test2',
            puid: 'uvw',
            timestamp: '2021-01-01T00:00:00Z',
        });
        expect(manifest.manifest.content?.length).toBe(2);
    });
});

describe('manifest file operations', () => {
    // Path to our temporary directory and file
    const tmpDir = join(tmpdir(), 'xpoc_tmp');
    const tmpFilePath = join(tmpDir, 'xpoc-manifest.json');

    // Before all tests, ensure the directory exists
    beforeAll(async () => {
        try {
            await fs.access(tmpDir, fs.constants.F_OK);
        } catch (err) {
            // Directory does not exist, create it
            await fs.mkdir(tmpDir);
        }
    });

    const testManifest = Manifest.loadFromFile('./testdata/xpoc-manifest.json');
    test('load manifest from file', () => {
        // sanity check
        expect(testManifest).toBeDefined();
        expect(testManifest?.manifest.name).toBe('A test name');
        expect(testManifest?.manifest.version).toBe(Manifest.LatestVersion);
        expect(testManifest?.manifest.updated).toBe('2023-10-23T15:00:00Z');
        expect(testManifest?.manifest.accounts?.length).toBe(16);
        expect(testManifest?.manifest.content?.length).toBe(11);
    });

    (testManifest ? test : test.skip)('match accounts', () => {
        // search using each parameter (values will be canonicalized)
        const searchValues: AccountMatchValues[] = [
            { account: '@a_ig_test_account ' },
            { platform: 'instagram' },
            { url: 'https://www.instagram.com/a_ig_test_account' },
        ];
        for (const searchValue of searchValues) {
            const accounts = testManifest?.matchAccount(searchValue);
            expect(accounts?.length).toBe(1);
            if (accounts) {
                const account = accounts[0];
                expect(account.account).toBe('a_ig_test_account');
                expect(account.platform).toBe('Instagram');
                expect(account.url).toBe(
                    'https://www.instagram.com/a_ig_test_account/',
                );
            }
        }
    });

    (testManifest ? test : test.skip)('match content', () => {
        // search using each parameter (values will be canonicalized)
        const searchValues: ContentMatchValues[] = [
            { account: '@a_ig_test_account ' },
            { platform: 'instagram' },
            { url: 'https://www.instagram.com/p/ABCDE12345/' },
            { puid: 'ABCDE12345' },
        ];
        for (const searchValue of searchValues) {
            const contents = testManifest?.matchContent(searchValue);
            expect(contents?.length).toBe(1);
            if (contents) {
                const content = contents[0];
                expect(content.account).toBe('a_ig_test_account');
                expect(content.platform).toBe('Instagram');
                expect(content.url).toBe(
                    'https://www.instagram.com/p/ABCDE12345/',
                );
            }
        }
    });

    test('save manifest to file', async () => {
        const manifest = new Manifest({
            name: 'A test name',
            baseurl: 'example.com',
            version: Manifest.LatestVersion,
            updated: '2023-10-23T15:00:00Z',
            accounts: [],
            content: [],
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

describe('manifest validation', () => {
    // Path to our temporary directory and file
    const tmpDir = join(tmpdir(), 'xpoc_tmp');
    const tmpFilePath = join(tmpDir, 'xpoc-manifest.json');

    //
    // TODO: create additional test manifests with invalid values
    //

    // Before all tests, ensure the directory exists
    beforeAll(async () => {
        try {
            await fs.access(tmpDir, fs.constants.F_OK);
        } catch (err) {
            // Directory does not exist, create it
            await fs.mkdir(tmpDir);
        }
    });

    const testManifest = Manifest.loadFromFile('./testdata/xpoc-manifest.json');

    test('validate schema: valid', () => {
        const validation = Manifest.validate(testManifest.manifest);
        expect(validation.valid).toBe(true);
    });

    test('validate schema: missing version', () => {
        const clonedManifest = { ...testManifest.manifest };
        delete (clonedManifest as Partial<XPOCManifest>).version;
        const validation = Manifest.validate(clonedManifest);
        expect(validation.valid).toBe(false);
        expect(validation.errors?.[0]).toContain(
            "must have required property 'version'",
        );
    });

    test('validate schema: bad account url', () => {
        const clonedManifest = { ...testManifest.manifest };
        if (clonedManifest.accounts) {
            clonedManifest.accounts[0].url =
                clonedManifest.accounts[0].url?.replace('https://', 'http://');
        }
        const validation = Manifest.validate(clonedManifest);
        expect(validation.valid).toBe(false);
        expect(validation.errors?.[0]).toContain(
            'must match pattern "^https://"',
        );
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

describe('manifest download', () => {
    // the test manifest at ./testData/xpoc-manifest.json, but in the repo
    const manifestUrl =
        'https://raw.githubusercontent.com/microsoft/xpoc-framework/main/lib/testdata';

    test('download: valid manifest', async () => {
        const manifest = await Manifest.download(manifestUrl);
        expect(manifest.valid).toBe(true);
    });

    test('download: valid manifest (trailing slash)', async () => {
        const manifest = await Manifest.download(manifestUrl + '/');
        expect(manifest.valid).toBe(true);
    });

    test('download: valid manifest (full path)', async () => {
        const manifest = await Manifest.download(
            manifestUrl + '/xpoc-manifest.json',
        );
        expect(manifest.valid).toBe(true);
    });

    test('download: non-existent url', async () => {
        const manifest = await Manifest.download(manifestUrl + 'x').catch(
            (err) => err,
        );
        const error = manifest as FetchError;
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toMatch('NOT-FOUND');
    });

    test('download: not JSON file', async () => {
        const manifest = await Manifest.download(
            'https://raw.githubusercontent.com/microsoft/xpoc-framework/main/lib/README.md',
        ).catch((err) => err);
        const error = manifest as FetchError;
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toMatch('NOT-FOUND');
    });
});
