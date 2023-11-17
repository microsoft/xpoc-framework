# Cross-Platform Origin of Content Browser Extension

This project contains a Edge/Chrome/Firefox Browser Extension demonstrating how to validate XPOC-protected content (see the Cross-Platform Origin of Content framework [specification](../doc/xpoc-specification.md)).

## Setup

1. Install dependencies
```
npm install
```

2. Build the extension
```
npm run build
```

3. Install extension in browser:  

<div style="padding-left: 2em">
Follow the side-loading instruction for your browser to load the extension:

[Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)  
[Chrome](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)  
[Firefox](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) 

The Edge/Chrome `manifest.json` file is located at `samples/browser-extension/dist/chrome`  
The Firefox `manifest.json` file is located at `samples/browser-extension/dist/firefox`  

Firefox requires additional extension permissions to download manifests from external sites
1) In the Firefox address bar go to `about:addons` to see the installed extensions
2) Find **Cross-Platform Origin of Content Extension** and click the `...` button to the right
3) Select **Manage** from the pop-up menu
4) Click the **Permission** tab
5) Enable **Access your data for all websites**
</div>

## Usage

When visiting a page with a XPOC URI (for example, `xpoc://example.com!`), right-click on the URI text and select **Verify XPOC link** from the context menu. The extension will fetch the corresponding XPOC manifest and determine if the current page's item is indeed listed in the manifest.
