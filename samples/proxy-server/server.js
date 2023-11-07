import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const app = express();

app.use(cors());

let browser;
async function startBrowser() {
    browser = await puppeteer.launch({
      headless: "new" // Opting into the new headless mode
    });
}

// an isalive path
app.get('/isalive', (req, res) => {
  res.status(200).send('Alive');
});

// a simple proxy server
app.get('/fetch', async (req, res) => {
  console.log('Fetching URL:', req.query.url);
  const url = req.query.url;
  try {
    const response = await fetch(url);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error('Failed to fetch URL:', error);
    res.status(500).send('Internal Server Error');
  }
});

const usePupeeteer = true;
// check if an account is referenced in the page content
// @param url: the URL to fetch
// @param platform: the platform to check (currently only twitter is supported)
// @param account: the platform account
// @return found: true if the account was referenced in the page content
app.get('/check', async (req, res) => {
  if (!req.query.url || !req.query.platform || !req.query.account) {
    return res.status(400).json({ error: 'url, platform, and account parameters are required' });
  }
  let url = req.query.url;
  let platform = req.query.platform.toLowerCase();
  let account = req.query.account.toLowerCase();

  try {
    let pageContent = "";
    if (usePupeeteer) {
      const context = await browser.createIncognitoBrowserContext();
      console.log('Fetching URL:', url);
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' }); // 'networkidle2' waits until the network is idle (no more than 2 connections for at least 500 ms).
      pageContent = await page.content(); // Retrieves the full HTML contents of the page, including the executed JavaScript.
      await page.close();
      await context.close();
    } else {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      pageContent = await response.text();
    }
    const lowerCasePageContent = pageContent.toLowerCase();
    const twitterUrlPattern = `twitter.com/${account}`;
    console.log(`Checking if ${twitterUrlPattern} is in fetched content...`);
    let result = {
      found: false
    }
    if (lowerCasePageContent.includes(twitterUrlPattern)) {
      console.log(`Found ${twitterUrlPattern} on ${url}`);
      result.found = true;
      result.foundAccount = twitterUrlPattern;
    } else {
      console.log(`${twitterUrlPattern} not found on ${url}`);
      // check if other twitter account is found
      const twitterAccountRegex = /twitter\.com\/(\w+)/;
      const match = lowerCasePageContent.match(twitterAccountRegex);
      if (match) {
        console.log(`Found ${match[0]} on ${url}`);
        result.foundAccount = match[0];
      } else {
        console.log(`No Twitter account found on ${url}`);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Initialize the browser when the server starts
startBrowser();

// Make sure to close the browser when the server is closing
process.on('exit', () => {
    browser.close();
});