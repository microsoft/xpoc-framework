# Cross-Platform Origin of Content Browser Extension

This project contains a Edge/Chrome Browser Extension demonstrating how to validate XPOC-protected content (see the Cross-Platform Origin of Content framework [ specification](../doc/xpoc-specification.md)).

TODO: MORE details

## Setup

Follow the [sideloading instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading) to load the browser extension into Edge, and the [unpacked loading instructions](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) to load it in Chrome.

## Usage

When visiting a page with a XPOC URI (for example, `xpoc://example.com`), right-click on the URI and select "Verify XPOC Content" from the context menu. The extension will fetch the corresponding XPOC manifest and determine if the current page's item is indeed listed in the manifest.

TODO: more details
