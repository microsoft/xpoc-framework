# Client-side XPOC sample pages

This is a sample implementation of client-side HTML/JavaScript pages to view and edit XPOC manifests and to validate XPOC URIs, demonstrating how to interact with XPOC artifacts. For details about XPOC, consult the [specification](../../doc/xpoc-specification.md).

The sample contains three pages (accessible from `public/index.html`):
* `public/xpoc-editor.html`: use to create and edit XPOC manifests
* `public/xpoc-viewer.html`: to view a XPOC manifest hosted on a website
* `public/xpoc-validator.html`: to validate a XPOC resource associated with a XPOC URI 

Note that client-side functionality could be limited by a browser security policy. For example, deploying such pages on a public facing web server would run into same-origin policy issues, preventing it from making cross-domain requests. This can be worked around by having target servers setting CORS headers, using a server-side proxy, or using a CORS proxy service. For alternative sample implementations, see the [server-side portal](TODO), or the [browser extension](../../browser-extension/README.md).

## Self hosting

These pages can be self-hosted by creating an express server, for example, following these steps: 

1. Create a `server.js` file:
```javascript
const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
```
2. Create and build a npm project
```
npm init -y
npm install express
```

3. Start the server
```
node server.js
```

The sample pages can be accessed at `http://localhost:3000/index.html`.

