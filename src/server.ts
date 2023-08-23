// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express, { Request, Response } from 'express';
import { createManifest, XPOCManifest } from './xpoc';
import dotenv from 'dotenv';
import axios from 'axios';
import fileUpload from 'express-fileupload';
import { Twitter, Youtube } from './platform';
import cors from 'cors';
import { validateManifest } from './validator'; 

dotenv.config();

const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public'));
app.use(fileUpload());
app.use(cors());

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

app.post('/add', async (req: Request, res: Response) => {
  
  console.log(req.body);
  if (!req.files || !req.files.file) {
    return res.status(400).send({ error: 'No files were uploaded.' });
  }

  if (Array.isArray(req.files.file)) {
    return res.status(400).send({ error: 'Only one file is allowed.' });
  }
  const uploadedFile = req.files.file;


  let manifest: XPOCManifest;
  try {
    manifest = JSON.parse(uploadedFile.data.toString());
  } catch (err) {
    return res.status(400).send({ error: 'Error parsing uploaded JSON.' });
  }

  const { title, platform, desc, account, finalSubmission } = req.body;

  if (finalSubmission === 'true') {
    // If this is the final submission, process it further.
    const url = typeof req.body.url === 'string' ? req.body.url : '';
    if (!url) {
        return res.status(400).send({ error: 'URL not provided or is not a valid string.' });
    }
    let puid: any;
    if (platform === "youtube") {
      if (url.includes('v=')) {
          puid = url.split('v=')[1].split('&')[0];
          console.log(`Extracted YouTube puid (video ID): ${puid}`);
      } else {
          console.error(`Failed to extract puid from provided YouTube URL: ${url}`);
          return res.status(400).send({ error: 'YouTube URL does not have a valid video ID.' });
      }
    } else if (platform === "twitter") {

      const twitterStatusPattern = /twitter\.com\/\w+\/status\/(\d+)/;
      const match = url.match(twitterStatusPattern);
  
      if (match && match[1]) {
          puid = match[1];
          console.log(`Extracted Twitter puid (tweet ID): ${puid}`);
      } else {
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
  const fileName = `manifest_${new Date().toISOString()}.json`;
  res.send(manifest);  // send back the updated manifest
  res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(manifest, null, 4)); 

});

app.post('/validate', async (req: Request<{}, {}, { url: string }>, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
      return res.status(400).send({ error: 'Invalid or empty url' });
  }
  try {
    console.log("Attempting to fetch manifest for url:", url);
    const manifestData = await validateManifest(url);
    console.log("Fetched manifest:", manifestData);
    res.send(manifestData);  // Return the manifest data if found.
  } catch (error) {
  console.error("Error in validateManifest:", error);
  res.status(500).send({ error: 'No XPOC manifest found or error occurred fetching it.' });
}

});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
