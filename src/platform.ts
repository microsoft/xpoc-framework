// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from 'axios';
import cheerio from 'cheerio';

export interface PlatformContentData {
    title: string;
    platform: string;
    account: string;
    puid: string;
    xpocUri: string;
  }
  
export interface Platform {
    // the platform's hostnames, e.g. ['example.com', 'exam.ple']
    Hostnames: string[];

    // returns the content data for a given content URL on the platform
    getData(url: string): Promise<PlatformContentData>;

    // returns the XPOC URI for a given content URL on the platform
    getXpocUri(url: string): Promise<string>;
}

// extracts a XPOC URI from a string
const findXpocUri = (text:string | undefined) => {
    if (!text) { throw new Error("Invalid content; can't search for XPOC URI"); }
    // XPOC URI regex, to capture the manifest URL
    const xpocRegex = /xpoc:\/\/(.*?)(\s|$)/;
    const match = xpocRegex.exec(text);
    if (match) {
        return match[1]; // return the captured group
    } else {
        throw new Error('Content does not contain a XPOC URI');
    }
}

export const Youtube: Platform = {
    Hostnames: ['youtube.com', 'youtu.be'],

    getData: async (url: string): Promise<PlatformContentData> => {
        let videoId = url.split('v=')[1].substring(0, 11);
        // Validate the videoId
        if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
            throw new Error('Malformed YouTube URL');
        }
        const fetchUrl = 'https://www.youtube.com/watch?v=' + videoId;
        try {
            const response = await axios.get(fetchUrl);
            const $ = cheerio.load(response.data); // TODO: deprecated; update call to something that's not
            const description = $('meta[name="description"]').attr('content');
            const title = $('title').text();
            const account = $('a[href^="/channel/"]').first().text();
            const xpocUri = findXpocUri(description);
            return {
              title,
              platform: 'youtube',
              account,
              puid: videoId,
              xpocUri: xpocUri
            };
    
        } catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    },

    getXpocUri: async (url: string): Promise<string> => {
        try {
            const videoData = await Youtube.getData(url);
            return videoData.xpocUri;
        } catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    }
}

export const Twitter: Platform = {
    Hostnames: ['twitter.com', 'x.com'],

    getData: async (url: string): Promise<PlatformContentData> => {
        const splitUrl = url.split('/');
        const tweetId = splitUrl[splitUrl.length - 1]; 
        
        // Validate the tweetId
        if (!tweetId || !/^[0-9]+$/.test(tweetId)) {
            throw new Error('Malformed Twitter URL');
        }

        // TODO: is that robust? Twitter can have other items appended to the path
        
        if (!process.env.TWITTER_BEARER_TOKEN) {
            throw new Error('Missing Twitter API bearer token in environment');
        }
    
        try {
            const response = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
                },
            });
            
            console.log(response.data);
            const tweetData = response.data.data;
            const xpocUri = findXpocUri(tweetData.title);
            return {
                title: tweetData.text,
                platform: 'twitter',
                account: tweetData.author_id, // Note: This will be the user's ID, not their screen name
                puid: tweetData.id,
                xpocUri: xpocUri
            };
        } catch (err) {
            console.error(err);
            throw new Error(`Error fetching Twitter data: ${(err as Error).message}`);
        }
    },
    
    getXpocUri: async (url: string): Promise<string> => {
        try {
            const tweetData = await Twitter.getData(url);
            return tweetData.xpocUri;
        } catch (err) {
            throw new Error('Failed to fetch Twitter data');
        }
    }
}

  