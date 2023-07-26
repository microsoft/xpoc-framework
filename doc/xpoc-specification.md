# Cross-Platform Origin of Content (XPOC) Framework Specification

This document specifies the Cross-Platform Origin of Content (XPOC) framework, to enable interoperable implementation.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119](https://www.rfc-editor.org/rfc/rfc2119).

## System Overview

A content Owner can attest to the origin of media items hosted on various platforms by listing them in a manifest on its own website `[ORIGIN_URL]`, and by attaching a XPOC URI `xpoc://[ORIGINI_URL]` to the content items (in a platform-specific way) pointing back to the manifest. Verifiers can validate the origin of an item by using the XPOC URI to discover the Owner's manifest and by verifying that the item is indeed listed therein.

## Terminology

*Owner*: entity owning or approving content items hosted on various platforms.

*Verifier*: entity validating the origin of a content item.

*Origin website*: website of the Owner hosting the XPOC manifest, represented by `[ORIGIN_URL]` in this document.

*Manifest*: a file listing of content items owner or authorized by the Owner.

*Content item*: a piece of content (e.g., post, image, video) hosted on a platform.

*Hosting platform*: site where the content item is located.

## Manifest

### Schema

A XPOC manifest is a JSON file with the following schema:

```
{
    name: string,
    hostname: string,
    content: [
        {
            idx: number,
            title: string,
            desc: string,
            url: string,
            platform: string,
            puid: string,
            account: string
        }, ...
    ]
}
```

where:
* `name` is the human-readable name of the Owner,
* `hostname` is the hostname of the Owner's website, i.e., the top-level URL without the protocol header (e.g., `example.com`),
* `content` is an array of XPOC content items, JSON objects with the following properties:
  * `idx` is a numerical index, which MUST be unique within the manifest,
  * `title` is the label for the content item,
  * `desc` is a description of the content item,
  * `url` is the URL of the content item on a hosting platform,
  * `platform` is the name of the hosting platform.
  * `puid` is a platform-specific unique identifier of the hosted content, and
  * `account` is the platform-specific account name which owns the content item.

### Location

The manifest MUST be hosted at the Origin website's well-known TLS-protected location: `https://[ORIGIN_URL]/.well-known/xpoc-manifest.json`.

### XPOC URI

The manifest XPOC URI is the following string: `xpoc://[ORIGIN_URL]`. The Owner attaches the XPOC URI to the content item it creates, for example, by including it in an item's metadata, label, or description.

## Example

The following section gives an example of a content owner Alex Example, who owns the `alexexample.com`, creating a XPOC manifest and content items.

### Setup

Alex creates a manifest and makes it available at `https://alexexample.com/.well-known/xpoc-manifest.json`:

```json
{
    "name": "Alex Example",
    "hostname": "alexexample.com",
    "content": []
}
```

### Content creation

Alex posts a video on youtube at `https://www.youtube.com/watch?v=abcdef12345` under the account `@AlexExample` and adds the XPOC URI `xpoc://alexexample.com` in the video's description.

Alex then adds the following JSON object to the manifest's `content` array:
```json
    "idx": 1,
    "title": "My first video",
    "desc": "Quick video to say Hello World!",
    "url": "https://www.youtube.com/watch?v=abcdef12345",
    "platform": "youtube.com",
    "puid": "abcde12345",
    "account": "@AlexExample"
```

### Content validation

A verifier can check that the youtube video posted by `@AlexExample` is indeed from `alexexample.com` by:
1. Parsing the XPOC URI to get the `alexexample.com` hostname,
2. Retrieving the XPOC manifest from `https://alexexample.com/.well-known/xpoc-manifest.json`, and
3. Verifying that the video URL is listed in the manifest.