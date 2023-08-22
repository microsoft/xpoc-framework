// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express, { Request, Response } from 'express';
import { createManifest, XPOCManifest } from './xpoc';
import dotenv from 'dotenv';
import axios from 'axios';
import fileUpload from 'express-fileupload';
import { Twitter, Youtube } from './platform';


dotenv.config();

const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));

interface AddRequestBody {
  url: string;
  platform: 'youtube' | 'twitter';
}

interface ProcessRequestBody {
  xpocUri?: string;
  url: string;
}

const XpocScheme = "xpoc://";

export function getBaseURL(url: string) {
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

// returns the XPOC manifest item for a given content URL
app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
  let { xpocUri, url } = req.body;

  // Validate inputs
  if (!url || typeof url !== 'string' ) {
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
        } catch (err) {
            res.status(500).send({ error: 'Error parsing the URL' });
        }
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
  }

  try {
    // Fetch the manifest
    const xpocUrl = new URL(xpocUri.replace('xpoc://', 'https://'));
    const manifestUrl = `${xpocUrl.origin}${xpocUrl.pathname}/xpoc-manifest.json`;
    console.log(manifestUrl);

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
      res.status(500).send({ error: 'Failed to fetch the XPOC manifest.' });
  }
});


app.post('/add', async (req, res) => {

  console.log('Request body:', req.body);
  console.log('Files:', req.files);

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({ error: 'No files were uploaded.' });
  }

  let uploadedFile: any = req.files.file;
  if (uploadedFile && uploadedFile.name) {
    console.log("A file was loaded:", uploadedFile.name);
  } else {
    console.log("File object structure:", uploadedFile);
  }

  let existingManifest;
  try {
    existingManifest = JSON.parse(uploadedFile.data.toString('utf8'));
    console.log("Uploaded file content:", uploadedFile.data.toString('utf8'));
  } catch (err) {
    return res.status(400).send({ error: 'Uploaded file is not valid JSON.' });
  }

  const url = req.body.url;
  const platform = req.body.platform;

  if (!url || !platform) {
    return res.status(400).send({ error: 'URL or platform missing in the request.' });
  }

  console.log(`Additional URL provided: ${url}`);  // Logging the additional URL provided in the form.

  try {
    const newManifest = await createManifest(url, platform, existingManifest);
    console.log(`A link was added to the manifest: ${url}`);
    res.send(newManifest); 
  } catch (err: any) {
      if (err && typeof err.message === 'string') {
          res.status(500).send({ error: err.message });
      } else {
          res.status(500).send({ error: 'An unknown error occurred' });
      }
  }  
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
