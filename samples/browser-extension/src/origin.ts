// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Platforms } from 'xpoc-ts-lib'

export interface OriginSource {
    // name of the source
    name: string,
    // path to the logo image
    logo: string,
    // website of the source
    website: string,
    // contact platforms supported by the source
    supportedPlatforms: string[]
}

export interface OriginSourceData {
    source: OriginSource,
    entry: string[],
    contactTables: { [key: string]: { [key: string]: number } }
}

let originSourceData: OriginSourceData | undefined

export interface OriginInfo {
    // The referenced page's platform
    platform: string,
    // The name of the page owner
    name: string,
    // A short description of the page owner
    info: string,
    // The website of the page owner
    website: string,
    // The reference URL confirming this information
    refUrl: string,
    // The source of the information, must be a valid OriginSource name
    source: string
}

export function getOriginInfo(url: string | undefined): OriginInfo | undefined {
    console.log(`getOriginInfo called url: ${url}`)
    if (!originSourceData) {
        console.log(`no origin data source set`)      
        return undefined
    }
    if (!url) {
        return undefined
    }

    console.log(`getOriginInfo url: ${url}`)

    let platform = ''
    let name = ''
    let info = ''
    let website = ''
    let refUrl = ''

    const platformObj = Platforms.getPlatformFromAccountUrl(url)
    let urlToTest = ''
    if (platformObj) {
        console.log(`getOriginInfo platformObj: ${platformObj.DisplayName}`)
        if (originSourceData.source.supportedPlatforms.includes(platformObj.DisplayName))
        {
            platform = platformObj.DisplayName
            // get the canonical data for the url
            const canonicalData = platformObj.canonicalizeAccountUrl(url)
            // only keep the path (remove the 'https://hostname/' part of the url)
            let urlPath = canonicalData.url.substring(platformObj.CanonicalHostname.length + 1)
            // remove trailing slash
            urlToTest = urlPath.replace(/\/$/, '')
            console.log(`getOriginInfo urlToTest: ${urlToTest}`)   
        }
    } else {
        console.log(`getOriginInfo url: ${url} is not a supported platform`)
        // check if the url is in the Website table
        platform = 'Website'
        // remove the scheme and trailing slash, and make url lowercase
        urlToTest = url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '').toLowerCase()
    }
    if (urlToTest &&
        originSourceData.contactTables.hasOwnProperty(platform) &&
        originSourceData.contactTables[platform] &&
        originSourceData.contactTables[platform].hasOwnProperty(urlToTest)) {
        console.log(`getOriginInfo url: ${urlToTest} is in the contact table`)
        const index = originSourceData.contactTables[platform][urlToTest]
        const entry = originSourceData.entry[index]
        name = entry.replace("_", " ")
        info = ""
        refUrl = `${originSourceData.source.website}/${entry}`
    }

    if (name) {
        return {
            platform: platform,
            name: name,
            info: info,
            website: website,
            refUrl: refUrl,
            source: originSourceData.source.name
        }
    } else {
        return undefined
    }
}

// sets the origin data source, returns the OriginSourceData or throws an error
export function setOriginDataSource(data: OriginSourceData): OriginSource {
    console.log(`setOriginDataSource called`)

    if (!data || !data.source || !data.entry || !data.contactTables) {
        // TODO: more validation
        throw ("Invalid data source")
    }

    // set the global origin data source
    originSourceData = data

    // store the data source
    chrome.storage.local.set({ originDataSource: data }, function () {
        console.log(`Origin data source stored: ${data.source.name}`)
    });

    return data.source
}

function getOriginSourceData(): OriginSourceData | undefined {
    // load the origin data source from storage
    let originDataSource: OriginSourceData | undefined
    chrome.storage.local.get(['originDataSource'], (result) => {
        console.log(`getOriginSourceData result:`, result)
        const storedOriginSourceData = result?.originDataSource as OriginSourceData
        if (storedOriginSourceData) {
            originSourceData = storedOriginSourceData
            console.log(`Origin data source loaded: ${storedOriginSourceData.source.name}`)
        } else {
            console.log(`No origin data source found`)
        }
        
    })
    return originDataSource
}

// load the origin data source from storage
getOriginSourceData()

export function getOriginSource(): OriginSource | undefined {
    if (originSourceData) {
        return originSourceData.source
    } else {
        return undefined
    }
}