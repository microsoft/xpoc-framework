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

// Returns the base, sanitized URL given a complete one; i.e. a lowercase scheme + path URL
// Retains crucial query parameters for platforms such as YouTube and removes
// unnecessary query parameters or anchors, and trailing '/'

export function getBaseURL(url: string) {
  const urlObj = new URL(url);
  let searchParams = urlObj.searchParams;
  let queryParams = [];
  if(urlObj.hostname.includes('youtube') && searchParams.has('v')) {
      queryParams.push('v=' + searchParams.get('v'));
  }
  const baseURL = (urlObj.origin + urlObj.pathname + '?' + queryParams.join('&')).replace(/\/$/, '').toLowerCase();
  return baseURL;
}

// returns the XPOC manifest item for a given content URL
app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
    const { url } = req.body;
    console.log("process url: " + url);

    if (!url || typeof url !== 'string') {
      return res.status(400).send({ error: 'Invalid or empty URL' });
    }

    // parse the URL to get the host name (e.g. example.com)
    let sanitizedUrl = "";
    let hostname = "";
    try {
        sanitizedUrl = getBaseURL(url);
        hostname = new URL(sanitizedUrl).hostname.split('.').slice(-2).join('.');
        console.log("hostname: " + hostname);
        console.log('sanitizedUrl:', sanitizedUrl);
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

        /* Add logs to debug content matching
        
         manifest.content.forEach((content, i) => {
          console.log(`content[${i}] url:`, content.url);
          console.log(`content[${i}] baseURL:`, getBaseURL(content.url));
        });*/

        const matchingContent = manifest.content.find(content => getBaseURL(content.url).toLowerCase() === sanitizedUrl);

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
