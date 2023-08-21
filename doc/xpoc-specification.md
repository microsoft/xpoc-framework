# Cross-Platform Origin of Content (XPOC) Framework Specification

This document specifies the Cross-Platform Origin of Content (XPOC) framework, to enable interoperable implementation.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119](https://www.rfc-editor.org/rfc/rfc2119).

## System Overview

A content Owner can attest to the ownership of various account on hosting platforms and to the origin of content items hosted on these platforms by listing both the accounts and content items in a manifest on its own website `[ORIGIN_URL]`. A content Owner can attach a XPOC URI `xpoc://[ORIGIN_URL]` to their account page and content items (in a platform specific way) pointing back to the manifest. Verifiers can validate the origin of an account or content item by using the XPOC URI to discover the Owner's manifest and by verifying that the account or content item is indeed listed therein. 

## Terminology

*Owner*: entity owning or approving content items hosted on various platforms.

*Verifier*: entity validating the origin of a content item.

*Origin website*: website of the Owner hosting the XPOC manifest, represented by `[ORIGIN_URL]` in this document.

*Manifest*: a file listing of content items owner or authorized by the Owner.

*Content item*: a piece of content (e.g., post, image, video) hosted on a platform.

*Account*: a platform-specific account (e.g., social handle).

*Hosting platform*: site where the content item is located.

## Manifest

### Schema

A XPOC manifest is a JSON file with the following schema:

```
{
    name: string,
    hostname: string,
    accounts: [
        {
            platform: string
            account: string
        }
    ]
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
* `accounts` is an array of the Owner's platform accounts, JSON objects with the following properties:
  * `platform` is the name of the hosting platform,
  * `url` is the URL of the account page, and
  * `account` is the platform-specific account name.
* `content` is an array of XPOC content items, JSON objects with the following properties:
  * `idx` is a numerical index, which MUST be unique within the manifest,
  * `title` is the label for the content item,
  * `desc` is a description of the content item,
  * `url` is the URL of the content item on a hosting platform,
  * `platform` is the name of the hosting platform,
  * `puid` is a platform-specific unique identifier of the hosted content, and
  * `account` is the platform-specific account name which owns the content item.

### Manifest Location 

The manifest MUST be hosted at the Origin website's well-known TLS-protected location: `https://[ORIGIN_URL]/.well-known/xpoc-manifest.json`.

### XPOC URI

The manifest XPOC URI is the following string: `xpoc://[ORIGIN_URL]`. The Owner attaches the XPOC URI to a platform account page (for example, in its bio) or a content item it creates (for example, by including it in an item's metadata, label, or description).

## Example

The following section gives an example of a content owner Alex Example, who owns the `alexexample.com`, creating a XPOC manifest and content items.

### Setup

Alex creates a manifest and makes it available at `https://alexexample.com/.well-known/xpoc-manifest.json`:

```json
{
    "name": "Alex Example",
    "hostname": "alexexample.com",
    "accounts": [],
    "content": []
}
```

### Account linking

Alex adds its X (formerly Twitter) account name `@ExAlex` to its known accounts by adding the XPOC URI `xpoc://alexexample.com` in its X bio and by adding the following JSON object to the manifest's `accounts` array:
```json
    "platform": "X",
    "url": "https://twitter.com/ExAlex",
    "account": "ExAlex"
```

### Content creation

Alex posts a video on Youtube at `https://www.youtube.com/watch?v=abcdef12345` under the account `@AlexExample` and adds the XPOC URI `xpoc://alexexample.com` in the video's description.

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

### Account validation

A verifier can check that a X (formerly Twitter) account is indeed owned by `alexexample.com` by:
1. Parsing the XPOC URI on the account page to get the `alexexample.com` hostname,
2. Retrieving the XPOC manifest from `https://alexexample.com/.well-known/xpoc-manifest.json`, and
3. Verifying that the account page is listed in the manifest's `accounts` property.


### Content validation

A verifier can check that the Youtube video posted by `@AlexExample` is indeed from `alexexample.com` by:
1. Parsing the XPOC URI to get the `alexexample.com` hostname,
2. Retrieving the XPOC manifest from `https://alexexample.com/.well-known/xpoc-manifest.json`, and
3. Verifying that the video URL is listed in the manifest's `content` property.
