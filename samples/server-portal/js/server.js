"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseURL = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const platform_1 = require("./platform");
const cors_1 = __importDefault(require("cors"));
const validator_1 = require("./validator");
dotenv_1.default.config();
const bodyParser = require('body-parser');
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use((0, express_fileupload_1.default)());
app.use((0, cors_1.default)());
const XpocScheme = "xpoc://";
function getBaseURL(url) {
    const urlObj = new URL(url);
    let searchParams = urlObj.searchParams;
    let queryParams = [];
    if (urlObj.hostname.toLocaleLowerCase().includes('youtube') && searchParams.has('v')) {
        queryParams.push('v=' + searchParams.get('v'));
    }
    const queryParamsString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    const baseURL = (urlObj.origin + urlObj.pathname + queryParamsString).replace(/\/$/, '').toLowerCase();
    return baseURL;
}
exports.getBaseURL = getBaseURL;
// returns the XPOC manifest item for a given content URL
app.post('/process', async (req, res) => {
    let { xpocUri, url } = req.body;
    // Validate inputs
    if (!url || typeof url !== 'string') {
        return res.status(400).send({ error: 'Invalid or empty URL' });
    }
    if (xpocUri && (typeof xpocUri !== 'string' || xpocUri.substring(0, XpocScheme.length) !== XpocScheme)) {
        return res.status(400).send({ error: 'Invalid XPOC URI' });
    }
    // get the XPOC URI if not provided
    if (!xpocUri) {
        xpocUri = "";
        // get the XPOC URI from the content hosted on a supported platform
        try {
            // parse the URL to get the host name (e.g. example.com)
            let sanitizedUrl = "";
            let hostname = "";
            try {
                sanitizedUrl = getBaseURL(url);
                hostname = new URL(sanitizedUrl).hostname.split('.').slice(-2).join('.');
                console.log("hostname: " + hostname);
                console.log('sanitizedUrl:', sanitizedUrl);
            }
            catch (err) {
                res.status(500).send({ error: 'Error parsing the URL' });
            }
            if (platform_1.Youtube.Hostnames.includes(hostname)) {
                xpocUri = await platform_1.Youtube.getXpocUri(url);
            }
            else if (platform_1.Twitter.Hostnames.includes(hostname)) {
                xpocUri = await platform_1.Twitter.getXpocUri(url);
            }
            else {
                res.status(400).send({ error: 'Unsupported platform' });
            }
        }
        catch (err) {
            res.status(500).send({ error: err });
        }
    }
    try {
        // Fetch the manifest
        const xpocUrl = new URL(xpocUri.replace('xpoc://', 'https://'));
        const manifestUrl = `${xpocUrl.origin}${xpocUrl.pathname}/xpoc-manifest.json`;
        console.log(manifestUrl);
        const xpocResponse = await axios_1.default.get(manifestUrl);
        const manifest = xpocResponse.data;
        // Check if content URL exists in the manifest
        const matchingContent = manifest.content.find(content => getBaseURL(content.url).toLowerCase() === getBaseURL(url).toLowerCase());
        if (matchingContent) {
            res.send({ manifest, matchingContent });
        }
        else {
            res.status(400).send({ error: 'Content URL not found in the XPOC manifest.' });
        }
    }
    catch (err) {
        res.status(500).send({ error: 'Failed to fetch the XPOC manifest.' });
    }
});
app.post('/add', async (req, res) => {
    console.log(req.body);
    if (!req.files || !req.files.file) {
        return res.status(400).send({ error: 'No files were uploaded.' });
    }
    if (Array.isArray(req.files.file)) {
        return res.status(400).send({ error: 'Only one file is allowed.' });
    }
    const uploadedFile = req.files.file;
    let manifest;
    try {
        manifest = JSON.parse(uploadedFile.data.toString());
    }
    catch (err) {
        return res.status(400).send({ error: 'Error parsing uploaded JSON.' });
    }
    const { title, platform, desc, account, finalSubmission } = req.body;
    if (finalSubmission === 'true') {
        // If this is the final submission, process it further.
        const url = typeof req.body.url === 'string' ? req.body.url : '';
        if (!url) {
            return res.status(400).send({ error: 'URL not provided or is not a valid string.' });
        }
        let puid;
        if (platform === "youtube") {
            if (url.includes('v=')) {
                puid = url.split('v=')[1].split('&')[0];
                console.log(`Extracted YouTube puid (video ID): ${puid}`);
            }
            else {
                console.error(`Failed to extract puid from provided YouTube URL: ${url}`);
                return res.status(400).send({ error: 'YouTube URL does not have a valid video ID.' });
            }
        }
        else if (platform === "twitter") {
            const twitterStatusPattern = /twitter\.com\/\w+\/status\/(\d+)/;
            const match = url.match(twitterStatusPattern);
            if (match && match[1]) {
                puid = match[1];
                console.log(`Extracted Twitter puid (tweet ID): ${puid}`);
            }
            else {
                console.error(`Failed to extract puid from provided Twitter URL: ${url}`);
                return res.status(400).send({ error: 'Twitter URL does not have a valid tweet ID.' });
            }
            // here you would add any other specific regex to capture the puid for other platforms 
            // with appropriate platform API access, other fields could also be captured from the API 
        }
        const newContentEntry = {
            title: title,
            platform: platform,
            desc: desc,
            account: account,
            puid: puid,
            url: url
        };
        manifest.content.push(newContentEntry);
    }
    res.send(manifest); // send back the updated manifest
});
app.post('/validate', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).send({ error: 'Invalid or empty url' });
    }
    try {
        console.log("Attempting to fetch manifest for url:", url);
        const manifestData = await (0, validator_1.validateManifest)(url);
        console.log("Fetched manifest:", manifestData);
        res.send(manifestData); // Return the manifest data if found.
    }
    catch (error) {
        console.error("Error in validateManifest:", error);
        res.status(500).send({ error: 'No XPOC manifest found or error occurred fetching it.' });
    }
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map