import express, { Request, Response } from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import {XPOCManifest} from './manifest';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

interface ProcessRequestBody {
    url: string;
}

app.post('/process', async (req: Request<{}, {}, ProcessRequestBody>, res: Response) => {
    const videoUrl = req.body.url;
    const videoId = videoUrl.split("v=")[1].substring(0, 11);
    const response = await axios.get(videoUrl);
    const $ = cheerio.load(response.data);
    const description = $('meta[name="description"]').attr('content');
    if (description == undefined) {
        res.status(500).send({ error: 'Failed to fetch video description' });
    } else {
        // parse xpoc link from description
        const xpocRegex = /xpoc:\/\/(.*?)(\s|$)/;
        const match = xpocRegex.exec(description);

        if (match) {
            // fetch the xpoc manifest
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
            res.status(404).send({ error: 'YouTube video does not contain a xpoc link' });
        }
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
