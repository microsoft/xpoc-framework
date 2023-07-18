export type ContentItem = {
    idx: number; 
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