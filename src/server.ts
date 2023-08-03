// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express, { Request, Response } from 'express';
import { createManifest, XPOCManifest } from './xpoc';
import dotenv from 'dotenv';
import axios from 'axios';
import { Twitter, Youtube } from './platform';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

interface ProcessRequestBody {
    url: string;
}

interface AddRequestBody {
  url: string;
  platform: 'youtube' | 'twitter';
}

// returns the base, sanitized URL given a complete one; i.e. a lowercase scheme + path URL without
// query-parameters or anchors, and without a trailing '/'
export function getBaseURL (url:string) {
        const urlObj = new URL(url);
        const baseURL = (urlObj.origin + urlObj.pathname).replace(/\/$/, '').toLowerCase();
        return baseURL;
}

// returns the XPOC manifest item for a given content URL
app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
    const { url } = req.body;
    console.log("process url: " + url);
    // parse the URL to get the host name (e.g. example.com)
    let sanitizedUrl = "";
    let hostname = "";
    try {
        sanitizedUrl = getBaseURL(url);
        hostname = new URL(sanitizedUrl).hostname.split('.').slice(-2).join('.');
        console.log("hostname: " + hostname);
    } catch (err) {
        res.status(500).send({ error: 'Error parsing the URL' });
    }

    // get the XPOC URI from the content hosted on a supported platform
    let xpocUri = "";
    try {
        if (Youtube.Hostnames.includes(hostname)) {
            xpocUri = await Youtube.getXpocUri(url);
        } else if (Twitter.Hostnames.includes(hostname)) {
            xpocUri = await Twitter.getXpocUri(url);
        } else {
            res.status(400).send({ error: 'Unsupported platform' });
        }
    } catch (err) {
        res.status(500).send({ error: err });
    }

    // fetch the XPOC manifest using the parsed XPOC URI
    const xpocUrl = 'https://' + xpocUri + '/xpoc-manifest.json'; // TODO: improve robustness, check if '/' is already present before concat
    try {
        const xpocResponse = await axios.get(xpocUrl);
        const manifest: XPOCManifest = xpocResponse.data;
        const matchingContent = manifest.content.find(content => getBaseURL(content.url) === sanitizedUrl);
        res.send({ manifest, matchingContent });
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch the XPOC manifest: ' + xpocUrl });
    }
});

app.post('/add', async (req: Request<{}, {}, AddRequestBody>, res: Response) => {
    const { url, platform } = req.body;
  
    const existingManifest: XPOCManifest = {
      name: "Default Name",
      hostname: "Default URL",
      content: []
    };
  
    const idx = existingManifest.content.length + 1;
  
    try {
      const newManifest = await createManifest(url, platform, existingManifest, idx);
  
      res.send(newManifest);
    } catch (err) {
      res.status(500).send({ error: (err as Error).message });
    }
  });
  

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
