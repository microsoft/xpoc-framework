# Client HTML with server backend XPOC sample pages

This is a sample implementation of client-side HTML/JavaScript frontend pages and a server backend to view XPOC manifests and to validate XPOC URIs, demonstrating how to interact with XPOC artifacts. These complement the [client-side HTML sample](../client-side-html/README.md), allowing the pages to fetch cross-domain web resources without restrictions. For details about XPOC, consult the [specification](../../doc/xpoc-specification.md).

The sample contains two pages (accessible from `public/index.html`):

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
