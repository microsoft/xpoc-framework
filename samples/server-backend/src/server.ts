import express from 'express';
import cors from 'cors';
import * as xpoc from 'xpoc-ts-lib';

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(cors());

// fetch the XPOC manifest from the given base URL or XPOC URI
const fetchManifest = async (location: string) => {
    // if location is a XPOC URI (starts with xpoc://), replace the protocol with https:// and remove the trailing '!' (if present)
    location = location.replace(/^xpoc:\/\//, 'https://').replace(/!$/, '');
    // add a https:// prefix if the location doesn't have one
    if (!/^https?:\/\//i.test(location)) {
        location = 'https://' + location;
    }
    // create the full manifest url
    const url = new URL(location);
    if (!url.pathname.endsWith('xpoc-manifest.json')) {
        url.pathname =
            (url.pathname.endsWith('/') ? url.pathname : url.pathname + '/') +
            'xpoc-manifest.json';
    }
    const urlString = url.toString();

    try { 
        const response = await fetch(urlString);
        const manifest = await response.json();
        return manifest;
    } catch (error) {
        console.error(`Error fetching XPOC manifest from ${urlString}: ` + error);
        throw new Error(`Error fetching XPOC manifest from ${urlString}`);
    }
}

// fetches the XPOC manifest from the specified location
app.get('/fetchManifest', async (req, res) => {
    try {
        const manifest = await fetchManifest(req.query.location as string);
        res.json(manifest);
    } catch (error) {
        console.error(`Error fetching XPOC manifest from ${req.query.location}: ` + error);
        res.status(500).send('Error fetching XPOC manifest');
    }
});

app.get('/fetchPlatformAccount', async (req, res) => {
    const url = req.query.url as string;
    console.log(`fetchPlatformAccount called: ${url}`);

    // make sure the URL is a valid account URL from a supported platform
    if (!xpoc.Platforms.isSupportedAccountUrl(url)) {
        console.error(`Unsupported platform: ${url}`);
        res.status(501).send('Unsupported platform');
        return;
    }

    // make sure we can fetch the account data from the platform
    if (!xpoc.Platforms.canFetchAccountFromUrl(url)) {
        console.error(`Cannot fetch account data from ${url}`);
        res.status(501).send('Cannot fetch account data from this platform');
        return;
    }

    try {
        // fetch the account data from the platform
        const account = await xpoc.Platforms.getAccountFromUrl(url);
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
    if (!xpoc.Platforms.isSupportedContentUrl(url)) {
        console.error(`Unsupported platform: ${url}`);
        res.status(501).send('Unsupported platform');
        return;
    }

    // make sure we can fetch the content data from the platform
    if (!xpoc.Platforms.canFetchContentFromUrl(url)) {
        console.error(`Cannot fetch content data from ${url}`);
        res.status(501).send('Cannot fetch content data from this platform');
        return;
    }
    
    try {
        // fetch the content data from the platform
        const content = await xpoc.Platforms.getAccountFromUrl(url);
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

    if (xpoc.Platforms.isSupportedAccountUrl(url)) {
        console.log('true');
        res.json({ isSupported: true, type: 'account' });
    } else if (xpoc.Platforms.isSupportedContentUrl(url)) {
        console.log('true');
        res.json({ isSupported: true, type: 'content' });
    } else {
        console.log('false');
        res.json({ isSupported: false });
    }
});

const canFetchPlatformResource = (url: string) => {
    if (xpoc.Platforms.canFetchAccountFromUrl(url)) {
        return {
            canFetch: true,
            type: 'account'
        };
    } else if (xpoc.Platforms.canFetchContentFromUrl(url)) {
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
            const data = await xpoc.Platforms.getAccountFromUrl(url);
            console.log(`verifyXpocResource: retrieved account data: ${JSON.stringify(data)}`);
            xpocUri = data.xpocUri;
        } else if (result.type === 'content') {
            const data = await xpoc.Platforms.getContentFromUrl(url);
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
    let manifest: xpoc.XPOCManifest;
    try {
        manifest = await fetchManifest(xpocUri);
        console.log(`verifyXpocResource: retrieved manifest: ${JSON.stringify(manifest)}`);

        // TODO: there could be more than one match; accumulate them

        // check if the url matches an account in the manifest
        const matchingAccount = manifest.accounts.find(account => account.url === url); // TODO: implement this in Manifest class
        if (matchingAccount) {
            res.json({ 
                manifest: manifest,
                account: matchingAccount }
            );
            return;
        }

        // check if the url matches a content item in the manifest
        const matchingContent = manifest.content.find(content => content.url === url); // TODO: implement this in Manifest class
        if (matchingContent) {
            res.json({
                manifest: manifest,
                content: matchingContent }
            );
            return;
        }

        // if we get here, the url was not found in the manifest
        res.status(400).send({ error: 'Resource URL not found in the XPOC manifest.' });
    } catch (error) {
        console.error(`Error fetching XPOC manifest from ${xpocUri}: ` + error);
        res.status(500).send('Error fetching XPOC manifest');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
