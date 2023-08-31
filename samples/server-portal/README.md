
TODO: more details about this sample

### Setup

Make sure [node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed on your system; the latest Long-Term Support (LTS) version is recommended for both. 

Build the `npm` package:
```
npm install
npm run build
```

Start the server:
```
`npm run start`
```

By default, the server listens on port 3000; edit [server.ts](../../src/server.ts) to modify this.

### Usage

This sample portal offers three pages: one to edit XPOC manifest, one to view them, and one to verify XPOC-protected content.

### Manifest Editor

The manifest editor can be used to edit or create manifests.

Navigate to http://localhost:3000/editor.html.

- Upload the manifest JSON file you want to edit.
- Enter the URL of the content to be added to the manifest.
- Enter the platform of the content.
- Click on "Update and Download manifest" to get the updated manifest.


### Content Validator

To validate the origin of content in a server portal, the content validator allows you to take the URL of content and validate its origin. 

Navigate to http://localhost:3000/validator.html.

- Enter the URL of the content to verify.
- If the platform doesn't allow public access to content, enter the associated XPOC URI.
- Click on "Verify Origin" to validate the content.

### Manifest Viewer

If you want to view all of the accounts and content that a given person has for their content, the manifest viewer portal can be used to do so. 

Navigate to http://localhost:3000/viewer.html.

- Enter the base URL of the site to lookup.
- Click on "View" to fetch and display the manifest.