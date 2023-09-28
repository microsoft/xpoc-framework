# XPOC TypeScript reference implementation

This is a TypeScript library acting as reference implementation for the Cross-Platform Origin of Content (XPOC) framework. It allows the creation and update of XPOC manifests, and the validation of XPOC-protected content.

## Setup

Make sure [node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed on your system; the latest Long-Term Support (LTS) version is recommended for both. 

Build the `npm` package:
```
npm install
npm run build
```

Optionally, run the tests:
```
npm test
```

## Browser

Building the XPOC library will also build a browser-compatible bundle at `./browser/xpoc.min.js`

Include this in your html file with a script tag:
```html
<script src='lib/browser/xpoc.min.js'></script>
```

You can then access the XPOC libraray throught the global `xpoc` variable.
```html
<script>
    const platform = new xpoc.YouTube()
</script>
```