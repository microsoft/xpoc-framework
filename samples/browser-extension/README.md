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

3. Install the extension in a browser:  

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

When visiting a page with a XPOC URI (for example, `xpoc://example.com!`), right-click on the URI text and select **Verify XPOC link** from the context menu. The extension will fetch the corresponding XPOC manifest and determine if the current page's item is indeed listed within it. The extension can automatically find and verify the XPOC URIs in a page if the extension's **Verify XPOC URI automatically** option is enabled (in the popup's Options tab).

## Extension features

### 3rd party origin data source

The browser extension can be augmented by loading a 3rd party data source to confirm the origin of visited web pages. An origin data source can be loaded in the popup's Options tab, by clicking "Choose File" and selecting a JSON file with the following properties:

* `source`: an object with the following properties:
  * `name`: a string representing a displayable name for the data source,
  * `logo`: a data URL encoded logo for the data source that can be displayed in a HTML `<img>` tag,
  * `website`: a string representing the URL of the source (starting with `https://`),
  * `supportedPlatforms`: an array of string values representing platforms supported by the data source (must be one of the XPOC [recommended platforms](../../doc/platforms.md)).
* `entry`: an array of unique strings each representing an entity in the data source. The concatenation of the `source.website` and an entry value must be a HTTPS resolvable page.
* `contactTables`: an object of contact tables, one per platform (as listed in `source.supportedPlatforms`) and one generic "Website" one:
  * `Website`: an object containing string keys representing websites and integer values representing the index of the associated entry. A key must be a valid website without the `https://` prefix. For example, the `Website` object could contain the key/value pair "`example.com`: 3", where the `source.entry[3]` would represent the entity associated with `example.com`.
  * A supported platform (e.g., `Instagram`, `Facebook`, `YouTube`, `X`, `LinkedIn`, etc.): an object containing string keys representing platform account identifiers and integer values representing the index of the associated entry. A key must be a valid URL path that points to an account URL when concatenated with the platform's canonical URL. For example, the `Facebook` object could contain the key/value pair "`exampleuser`: 45", where the `source.entry[45]` would represent the entity associated with `https://www.facebook.com/exampleuser`.

  ### Using trust.txt files

  The [`trust.txt` specification](https://datatracker.ietf.org/doc/draft-org-trust-relationship-protocol/) defines a machine-readable text file hosted on a publisher’s domain, which provides information about the publisher’s affiliations, owned media properties, and connections with industry organizations. The `trust.txt` file offers similar functionality as a XPOC manifest. The browser extension can also detect the presence of a trust URI (for example, `trust://example.com!`) file on a visited page, and check if the page is listed in the corresponding `trust.txt` file on the origin domain.

  