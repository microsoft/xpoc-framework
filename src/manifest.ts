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