// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express, { Request, Response } from 'express';
import cheerio from 'cheerio';
import { XPOCManifest } from './manifest';
import { createManifest, getTwitterData } from './xpoc';
import dotenv from 'dotenv';
import axios from 'axios';

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

app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
    const { url } = req.body;
    let puid: string;
    console.log("process url: " + url);

    // parse the url to get the host name
    const hostname = new URL(url).hostname.split('.').slice(-2).join('.').toLowerCase();
    console.log("hostname: " + hostname);

    // for now we only support youtube and twitter
    // TODO: move platform-specific processing to their own file (youtube.ts, twitter.ts, etc.)
    if (hostname === 'youtube.com' || hostname === 'youtu.be') { // TODO: should we add more hostnames? e.g., country specific ones?
        const videoId = url.split('v=')[1].substring(0, 11);
        const fetchUrl = 'https://www.youtube.com/watch?v=' + videoId;
        const response = await axios.get(fetchUrl);
        const $ = cheerio.load(response.data);
        const description = $('meta[name="description"]').attr('content');
        if (!description) {
            res.status(500).send({ error: 'Failed to fetch video description' });
            return;
        } else {
            const xpocRegex = /xpoc:\/\/(.*?)(\s|$)/;
            const match = xpocRegex.exec(description);

            if (match) {
                const xpocUrl = 'https://' + match[1] + '/xpoc-manifest.json';
                try {
                    const xpocResponse = await axios.get(xpocUrl);
                    const manifest: XPOCManifest = xpocResponse.data;

                    const matchingContent = manifest.content.find(content => content.puid === videoId);
                    res.send({ manifest, matchingContent });
                } catch (err) {
                    res.status(500).send({ error: 'Failed to fetch the xpoc manifest: ' + xpocUrl });
                }
            } else {
                res.status(404).send({ error: 'Content does not contain a xpoc link' });
            }
        }
    } else if (hostname === 'twitter.com' || hostname === 'x.com') {
        const splitUrl = url.split('/');
        const tweetId = splitUrl[splitUrl.length - 1];

        try {
            const tweetData = await getTwitterData(tweetId);

            const xpocRegex = /xpoc:\/\/(.*?)(\s|$)/;
            const match = xpocRegex.exec(tweetData.title);

            if (match) {
                const xpocUrl = 'https://' + match[1] + '/xpoc-manifest.json';

                try {
                    const xpocResponse = await axios.get(xpocUrl);
                    const manifest: XPOCManifest = xpocResponse.data;

                    const matchingContent = manifest.content.find(content => content.puid === tweetId);

                    if (matchingContent) {
                        res.send({ manifest, matchingContent });
                    } else {
                        res.status(404).send({ error: 'No matching content found in the XPOC manifest' });
                    }
                } catch (err) {
                    res.status(500).send({ error: 'Failed to fetch the XPOC manifest: ' + xpocUrl });
                }
            } else {
                res.status(404).send({ error: 'Content does not contain an XPOC link' });
            }
        } catch (err) {
            res.status(500).send({ error: 'Failed to fetch Twitter data' });
        }
    } else {
        res.status(400).send({ error: 'Unsupported platform' });
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
