export interface XPOCContent {
    idx: string, // index of content
    title: string, // name of content
    url: string, // link of content
    platform: string, // e.g. youtube
    puid: string, // uid of content on platform
    account: string, // e.g., youtube account
    auth?: string // authentication string 
}

export interface XPOCManifest {
    name: string,
    url: string,
    content: XPOCContent[]
}