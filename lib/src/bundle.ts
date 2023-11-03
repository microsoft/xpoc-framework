// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/*
    This differs from index.ts in that it is intended to be used as the entry for the bundle and uses ManifestBase instead of Manifest
    ManifestBase does not have the file system functions
*/
export { ManifestBase as Manifest } from './manifest.js';
export * from './platform.js';
