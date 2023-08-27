export type Account = {
    platform: string;
    url: string;
    account: string;
};
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
export declare function createManifest(url: string, platform: 'youtube' | 'twitter', existingManifest: XPOCManifest, title: string, desc: string, account: string): Promise<XPOCManifest>;
//# sourceMappingURL=xpoc.d.ts.map