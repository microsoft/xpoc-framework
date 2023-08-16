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
  xpocUri: string;   
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
  if(urlObj.hostname.toLocaleLowerCase().includes('youtube') && searchParams.has('v')) {
      queryParams.push('v=' + searchParams.get('v'));
  }
  const queryParamsString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
  const baseURL = (urlObj.origin + urlObj.pathname + queryParamsString).replace(/\/$/, '').toLowerCase();
  return baseURL;
}

// returns the XPOC manifest item for a given content URL
app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
  const { xpocUri, url } = req.body;

  // Validate inputs
  if (!url || typeof url !== 'string' || !xpocUri || typeof xpocUri !== 'string') {
      return res.status(400).send({ error: 'Invalid or empty URL or XPOC URI' });
  }

  // Fetch the manifest
  const manifestUrl = xpocUri.replace('xpoc://', 'https://') + '/.well-known/xpoc-manifest.json';

  try {
      const xpocResponse = await axios.get(manifestUrl);
      const manifest: XPOCManifest = xpocResponse.data;

      // Check if content URL exists in the manifest
      const matchingContent = manifest.content.find(content => getBaseURL(content.url).toLowerCase() === getBaseURL(url).toLowerCase());

      if (matchingContent) {
          res.send({ manifest, matchingContent });
      } else {
          res.status(400).send({ error: 'Content URL not found in the XPOC manifest.' });
      }

  } catch (err) {
      res.status(500).send({ error: 'Failed to fetch the XPOC manifest: ' + manifestUrl });
  }
});

// If you have platform support APIs that are not yet implemented, you can add them here with the code implemented in platform.ts. 


/* TODO: remove dead code

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

*/ 

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
