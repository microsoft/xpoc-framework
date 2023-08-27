"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Facebook = exports.Twitter = exports.Youtube = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
// extracts a XPOC URI from a string
const findXpocUri = (text) => {
    if (!text) {
        throw new Error("Invalid content; can't search for XPOC URI");
    }
    // XPOC URI regex, to capture the manifest URL
    const xpocRegex = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/g;
    const match = xpocRegex.exec(text);
    if (match) {
        return match[0]; // return the captured group
    }
    else {
        throw new Error('Content does not contain a XPOC URI');
    }
};
exports.Youtube = {
    Hostnames: ['youtube.com', 'youtu.be'],
    getData: async (url) => {
        let videoId = url.split('v=')[1].substring(0, 11);
        // Validate the videoId
        if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
            throw new Error('Malformed YouTube URL');
        }
        const fetchUrl = 'https://www.youtube.com/watch?v=' + videoId;
        try {
            const response = await axios_1.default.get(fetchUrl);
            const $ = cheerio_1.default.load(response.data); // TODO: deprecated; update call to something that's not
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
        }
        catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    },
    getXpocUri: async (url) => {
        try {
            const videoData = await exports.Youtube.getData(url);
            return videoData.xpocUri;
        }
        catch (err) {
            throw new Error('Failed to fetch YouTube data');
        }
    }
};
exports.Twitter = {
    Hostnames: ['twitter.com', 'x.com'],
    getData: async (url) => {
        const statusIndex = url.split('/').indexOf('status');
        const tweetId = url.split('/')[statusIndex + 1]; // get the next element after 'status' and avoids the issue if someone puts in /photo/1 in the URL
        // Validate the tweetId
        if (!tweetId || !/^[0-9]+$/.test(tweetId)) {
            throw new Error('Malformed Twitter URL');
        }
        // TODO: is that robust? Twitter can have other items appended to the path
        if (!process.env.TWITTER_BEARER_TOKEN) {
            throw new Error('Missing Twitter API bearer token in environment');
        }
        try {
            const response = await axios_1.default.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
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
                account: tweetData.author_id,
                puid: tweetData.id,
                xpocUri: xpocUri
            };
        }
        catch (err) {
            console.error(err);
            throw new Error(`Error fetching Twitter data: ${err.message}`);
        }
    },
    getXpocUri: async (url) => {
        try {
            const tweetData = await exports.Twitter.getData(url);
            return tweetData.xpocUri;
        }
        catch (err) {
            throw new Error('Failed to fetch Twitter data');
        }
    }
};
exports.Facebook = {
    Hostnames: ['facebook.com'],
    getData: async (url) => {
        const splitUrl = url.split("/");
        const nodeId = splitUrl[splitUrl.length - 1]; // Assuming the last element is the node id
        // TODO: This would need to be replaced with how you get your access token.
        const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('Missing Facebook API Access token in environment');
        }
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/${nodeId}?access_token=${accessToken}`);
            const fbData = response.data;
            const xpocUri = findXpocUri(fbData.description); // This assumes xpocUri is in the description field.
            return {
                title: fbData.name,
                platform: 'facebook',
                account: fbData.id,
                puid: fbData.id,
                xpocUri: xpocUri
            };
        }
        catch (err) {
            console.error(err);
            throw new Error(`Error fetching Facebook data: ${err.message}`);
        }
    },
    getXpocUri: async (url) => {
        try {
            const fbData = await exports.Facebook.getData(url);
            return fbData.xpocUri;
        }
        catch (err) {
            throw new Error('Failed to fetch Facebook data');
        }
    }
};
//# sourceMappingURL=platform.js.map