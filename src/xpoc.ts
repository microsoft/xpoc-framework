// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
import { Twitter, Youtube, PlatformContentData } from './platform';

dotenv.config();

export type ContentItem = {
  idx: number; 
  title: string;
  desc?: string;
  url: string;
  platform: string;
  puid: string;
  account: string;
};

export type XPOCManifest = {
  name: string;
  hostname: string;
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
    desc: '', // TODO: what could be the description? Add a field in web UI?
    url,
    platform: platformData.platform,
    puid: platformData.puid,
    account: platformData.account,
  });

  return existingManifest;
}
