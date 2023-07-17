export type ContentItem = {
    idx: number; // changed this from string to number
    title: string;
    url: string;
    platform: string;
    puid: string;
    account: string;
  };
  
  export type XPOCManifest = {
    name: string;
    url: string;
    content: ContentItem[];
  };