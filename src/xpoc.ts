// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import { XPOCManifest } from './manifest';

dotenv.config();

interface PlatformData {
  title: string;
  platform: string;
  account: string;
  puid: string;
}

type DataFetcher = {
  [platform in 'youtube' | 'twitter']: (url: string) => Promise<PlatformData>;
};

async function getYoutubeData(url: string): Promise<PlatformData> {
  const videoId = url.split('v=')[1].substring(0, 11);
  const fetchUrl = 'https://www.youtube.com/watch?v=' + videoId;
  const response = await axios.get(fetchUrl);
  const $ = cheerio.load(response.data);
  const title = $('title').text();
  const account = $('a[href^="/channel/"]').first().text();

  return {
    title,
    platform: 'youtube',
    account,
    puid: videoId,
  };
}

// This function gets the tweet data for a given ID
export async function getTwitterData(tweetId: string): Promise<PlatformData> {
    if (!process.env.TWITTER_BEARER_TOKEN) {
        throw new Error('Missing Twitter bearer token in environment');
    }

    try {
        const response = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
            headers: {
                Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            },
        });
        
        console.log(response.data); // For debugging

        const tweetData = response.data.data;
        return {
            title: tweetData.text,
            platform: 'twitter',
            account: tweetData.author_id, // Note: This will be the user's ID, not their screen name
            puid: tweetData.id,
        };
    } catch (err) {
        console.error(err); // For debugging
        throw new Error(`Error fetching Twitter data: ${(err as Error).message}`);
    }
}

const platformDataFetchers: DataFetcher = {
  youtube: getYoutubeData,
  twitter: getTwitterData,
};

export async function createManifest(
  url: string,
  platform: 'youtube' | 'twitter',
  existingManifest: XPOCManifest,
  idx: number
): Promise<XPOCManifest> {
  const platformDataFetcher = platformDataFetchers[platform];

  if (!platformDataFetcher) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const platformData = await platformDataFetcher(url);

  existingManifest.content.push({
    idx,
    title: platformData.title,
    desc: '', // TODO: what could be the description?
    url,
    platform: platformData.platform,
    puid: platformData.puid,
    account: platformData.account,
  });

  return existingManifest;
}
