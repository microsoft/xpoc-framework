import express from 'express';
import cors from 'cors';
import { Manifest, Platforms } from 'xpoc-ts-lib';
import "dotenv/config";

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000')

app.use(express.static('public'));
app.use(cors());

// fetches the XPOC manifest from the specified location
app.get('/fetchManifest', async (req, res) => {
    const manifest = await Manifest.download(req.query.location as string);
    if (manifest instanceof Error) {
        console.error(`Error fetching XPOC manifest from ${req.query.location}: ` + manifest);
        res.status(500).send('Error fetching XPOC manifest');
    } else {
        res.json(manifest.manifest);
    }
});

app.get('/fetchPlatformAccount', async (req, res) => {
    const url = req.query.url as string;
    console.log(`fetchPlatformAccount called: ${url}`);

    // make sure the URL is a valid account URL from a supported platform
    if (!Platforms.isSupportedAccountUrl(url)) {
        console.error(`Unsupported platform: ${url}`);
        res.status(501).send('Unsupported platform');
        return;
    }

    // make sure we can fetch the account data from the platform
    if (!Platforms.canFetchAccountFromUrl(url)) {
        console.error(`Cannot fetch account data from ${url}`);
        res.status(501).send('Cannot fetch account data from this platform');
        return;
    }

    try {
        // fetch the account data from the platform
        const account = await Platforms.getAccountFromUrl(url);
        console.log(`fetchPlatformAccount: retrieved account data: ${JSON.stringify(account)}`);
        res.json(account);
    } catch (error) {
        console.error(`Error fetching account data from ${url}: ` + error);
        res.status(500).send('Error fetching account data');
    }
});

app.get('/fetchPlatformContent', async (req, res) => {
    const url = req.query.url as string;
    console.log(`fetchPlatformContent called: ${url}`);

    // make sure the URL is a valid content URL from a supported platform
    if (!Platforms.isSupportedContentUrl(url)) {
        console.error(`Unsupported platform: ${url}`);
        res.status(501).send('Unsupported platform');
        return;
    }

    // make sure we can fetch the content data from the platform
    if (!Platforms.canFetchContentFromUrl(url)) {
        console.error(`Cannot fetch content data from ${url}`);
        res.status(501).send('Cannot fetch content data from this platform');
        return;
    }

    try {
        // fetch the content data from the platform
        const content = await Platforms.getAccountFromUrl(url);
        console.log(`fetchPlatformContent: retrieved content data: ${JSON.stringify(content)}`);
        res.json(content);
    } catch (error) {
        console.error(`Error fetching content data from ${url}: ` + error);
        res.status(500).send('Error fetching content data');
    }
});

app.get('/isSupportedPlatformResource', async (req, res) => {
    const url = req.query.url as string;
    console.log(`isSupportedPlatformResource called: ${url}`);

    if (Platforms.isSupportedAccountUrl(url)) {
        console.log('true');
        res.json({ isSupported: true, type: 'account' });
    } else if (Platforms.isSupportedContentUrl(url)) {
        console.log('true');
        res.json({ isSupported: true, type: 'content' });
    } else {
        console.log('false');
        res.json({ isSupported: false });
    }
});

const canFetchPlatformResource = (url: string) => {
    if (Platforms.canFetchAccountFromUrl(url)) {
        return {
            canFetch: true,
            type: 'account'
        };
    } else if (Platforms.canFetchContentFromUrl(url)) {
        return {
            canFetch: true,
            type: 'content'
        };
    } else {
        return {
            canFetch: false
        };
    }
}

app.get('/canFetchPlatformResource', async (req, res) => {
    const url = req.query.url as string;
    console.log(`canFetchPlatformResource called: ${url}`);
    const result = canFetchPlatformResource(url);
    res.json(result);
});

app.get('/verifyXpocResource', async (req, res) => {
    const url = req.query.url as string;
    let xpocUri = req.query.xpocUri as string;
    console.log(`verifyXpocResource called: url: ${url}, xpocUri: ${xpocUri}`);

    // if we don't have the XPOC URI, try finding one in the resource URL
    if (!xpocUri) {
        const result = canFetchPlatformResource(url);
        if (!result.canFetch) {
            console.error(`Can't fetch resource from url, need a XPOC URI`);
            res.status(500).send(`Can't fetch resource from url, need a XPOC URI`);
            return;
        }

        // try fetching the resource URL to find a xpoc URI
        if (result.type === 'account') {
            const data = await Platforms.getAccountFromUrl(url);
            console.log(`verifyXpocResource: retrieved account data: ${JSON.stringify(data)}`);
            xpocUri = data.xpocUri;
        } else if (result.type === 'content') {
            const data = await Platforms.getContentFromUrl(url);
            console.log(`verifyXpocResource: retrieved content data: ${JSON.stringify(data)}`);
            xpocUri = data.xpocUri;
        }

        if (!xpocUri) {
            console.error(`Can't a XPOC URI in the data retrieved from resource URL`);
            res.status(500).send(`Can't a XPOC URI in the data retrieved from resource URL; please provide a XPOC URI`);
            return;
        }
    }


        // fetch the XPOC manifest from the XPOC URI
        const manifest = await Manifest.download(xpocUri);

        if(manifest instanceof Error) {
            console.error(`Error fetching XPOC manifest from ${xpocUri}: ` + manifest);
            res.status(500).send('Error fetching XPOC manifest');
            return;
        }

        console.log(`verifyXpocResource: retrieved manifest: ${JSON.stringify(manifest.manifest)}`);

        // check if the url matches an account in the manifest
        const matchingAccounts = manifest.matchAccount({ url: url });
        if (matchingAccounts && matchingAccounts.length > 0) {
            console.log(`verifyXpocResource: found matching account: ${JSON.stringify(matchingAccounts)}`);
            res.json({
                manifest: manifest.manifest,
                accounts: matchingAccounts
            }
            );
            return;
        }

        // check if the url matches a content item in the manifest
        const matchingContent = manifest.matchContent({ url: url });
        if (matchingContent && matchingContent.length > 0) {
            console.log(`verifyXpocResource: found matching content: ${JSON.stringify(matchingContent)}`);
            res.json({
                manifest: manifest.manifest,
                content: matchingContent
            }
            );
            return;
        }

        // if we get here, the url was not found in the manifest
        res.status(400).send({ error: 'Resource URL not found in the XPOC manifest.' });

});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
