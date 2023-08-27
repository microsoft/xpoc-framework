export interface PlatformContentData {
    timestamp?: string;
    title: string;
    platform: string;
    account: string;
    puid?: string;
    xpocUri: string;
}
export interface Platform {
    Hostnames: string[];
    getData(url: string): Promise<PlatformContentData>;
    getXpocUri(url: string): Promise<string>;
}
export declare const Youtube: Platform;
export declare const Twitter: Platform;
export declare const Facebook: Platform;
//# sourceMappingURL=platform.d.ts.map