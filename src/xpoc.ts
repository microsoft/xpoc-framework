// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
import { Twitter, Youtube, PlatformContentData } from './platform';

dotenv.config();

export type Account = {
  platform: string,
  url: string,
  account: string;
}

export type ContentItem = {
  timestamp?: string;
  title: string;
  desc?: string;
  url: string;
  platform: string;
  puid?: string;
  account: string;
};

export type XPOCManifest = {
  name: string;
  hostname: string;
  version: string;
  accounts: Account[];
  content: ContentItem[];
};

type DataFetcher = {
  [platform in 'youtube' | 'twitter']: (url: string) => Promise<PlatformContentData>;
};

const platformDataFetchers: DataFetcher = {
  youtube: Youtube.getData,
  twitter: Twitter.getData,
};

export async function createManifest(
  url: string,
  platform: 'youtube' | 'twitter',
  existingManifest: XPOCManifest
): Promise<XPOCManifest> {
  
  let platformData;
  
  if (platform === 'youtube') {
    platformData = await Youtube.getData(url);
  } else if (platform === 'twitter') {
    platformData = await Twitter.getData(url);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  existingManifest.content.push({
    timestamp: new Date().toISOString(), // TODO: get that from the platform data
    title: platformData.title,
    desc: '', // TODO: what could be the description? Add a field in web UI?
    url,
    platform: platformData.platform,
    puid: platformData.puid,
    account: platformData.account,
  });

  return existingManifest;
}
