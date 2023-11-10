# Client HTML with server backend XPOC sample pages

This is a sample implementation of client-side HTML/JavaScript frontend pages and a server backend to view XPOC manifests and to validate XPOC URIs, demonstrating how to interact with XPOC artifacts. 

This uses the [client-side HTML sample](../client-side-html/README.md) pages, but allows the pages to fetch cross-domain web resources without restrictions. For details about XPOC, consult the [specification](../../doc/xpoc-specification.md).

The sample contains five pages (accessible from `public/index.html`):

-   `public/xpoc-ez-creator.html`: use to create XPOC manifests listing accounts on popular platforms
-   `public/xpoc-editor.html`: use to create and edit XPOC manifests
-   `public/xpoc-csvconverter.html`: use to convert CSV files to XPOC manifests
-   `public/xpoc-viewer.html`: to view a XPOC manifest hosted on a website
-   `public/xpoc-validator.html`: to validate a XPOC resource associated with a XPOC URI

## Setup

Make sure [node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed on your system; the latest Long-Term Support (LTS) version is recommended for both. 

1. Build the reference implementation library; see instructions in its [README](../../lib/README.md).

2. Build the `npm` package:

```
npm install
npm run build
```

3. Start the server:

```
npm run start
```

The sample pages can be accessed at `http://localhost:4000/index.html`.

>Note: The port may be changed in the `.env` file or by setting the `PORT` environment variable.
