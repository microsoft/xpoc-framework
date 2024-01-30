# XPOC TypeScript reference implementation

This is a TypeScript library acting as reference implementation for the Cross-Platform Origin of Content (XPOC) framework. It allows the creation and update of XPOC manifests, and the validation of XPOC-protected content.

## Setup

Make sure [node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed on your system; the latest Long-Term Support (LTS) version is recommended for both.

Install dependencies and build the package:

```bash
# The initial install will build the lib after installing dependencies
npm install

# Subsequent builds can be run with
npm run build
```

Optionally, run the tests:

```
npm test
```

## Browser

Building the XPOC library will also build a browser-compatible bundle at `./browser/xpoc.min.esm.js` or `./browser/xpoc.min.iife.js` depending on your desired support for ES modules.

#### As Script Tag

Include this in your html file with a script tag:

```html
<script src="./lib/browser/xpoc.min.iife.js"></script>
```

You can then access the XPOC library through the global `xpoc` variable.

```html
<script>
    const manifest = new xpoc.Manifest();
</script>
```

#### ES Modules

Include this in your html file with a script tag:

```html
<script type="module">
    import { Manifest } from './lib/browser/xpoc.min.esm.js';
    const manifest = new Manifest();
</script>
```
