# Cross-Platform Origin of Content (XPOC) Framework Specification

This document specifies the Cross-Platform Origin of Content (XPOC) framework, to enable interoperable implementation. The current version of the specification is 0.3 (see the [changes](./changes.md) history).

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119](https://www.rfc-editor.org/rfc/rfc2119).

## System Overview

A content Owner can attest to

1. the ownership of various accounts on hosting platforms, and
2. the origin of content items hosted on these platforms by listing both the accounts and content items in a manifest on its own website `[ORIGIN_URL]`.

A content Owner can attach a XPOC URI `xpoc://[ORIGIN_URL]` to their platform account page and content items (in a platform-specific way) pointing back to the manifest. Verifiers can validate the origin of an account or content item by using the XPOC URI to discover the Owner's manifest and by verifying that the account or content item is indeed listed therein.

## Terminology

_Owner_: entity owning or approving content items hosted on various platforms.

_Verifier_: entity validating the origin of a content item.

_Origin website_: website of the Owner hosting the XPOC manifest, represented by `[ORIGIN_URL]` in this document.

_Manifest_: a file listing of content items owned or authorized by the Owner.

_Content item_: a piece of content (e.g., post, image, video) hosted on a platform.

_Account_: a platform-specific account (e.g., social handle, user name).

_Hosting platform_: site where an account or a content item is located.

## Manifest

### Schema

A XPOC manifest is a JSON file with the following schema:

```
{
    name: string,
    baseurl: string,
    version: string,
    updated: string (optional),
    accounts: [
        {
            account: string
            platform: string,
            url: string (optional),
        }, ...
    ] (optional),
    content: [
        {
            account: string,
            platform: string,
            url: string,
            desc: string (optional),
            puid: string (optional),
            timestamp: string (optional)
        }, ...
    ] (optional)
}
```

where:

-   `name` is the human-readable name of the Owner,
-   `baseurl` is the base url of the Owner's website, i.e., the hostname (domain) followed by an optional path, without the protocol header (e.g., `example.com` or `example.com/some/path`),
-   `version` is the version number of the specification used to generate the manifest; currently `0.3`.
-   `updated`: last manifest update timestamp, represented in the ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.
-   `accounts` is an array of the Owner's platform accounts, JSON objects with the following properties:
    -   `account` is the platform-specific account name,
    -   `platform` is the name of the hosting platform, and
    -   `url` is the URL of the account page.
-   `content` is an array of XPOC content items, JSON objects with the following properties:
    -   `account` is the platform-specific account name which owns the content item,
    -   `platform` is the name of the hosting platform,
    -   `url` is the URL of the content item on a hosting platform,
    -   `desc` is a description of the content item,
    -   `puid` is a platform-specific unique identifier of the hosted content, and
    -   `timestamp` is the creation time of the item, represented in the ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

Date values are represented in the ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC. For example, Sept 1st, 2023, 10:30 UTC is represented as "2023-09-01T10:30:00Z".

Different platforms represent content differently; implementation SHOULD follow the [guidelines](./platforms.md) on how to encode platform-specific data for some popular hosting platforms.

Implementations SHOULD strictly adhere to the schema and content when creating manifests, but SHOULD be lenient when reading them and make a best effort to parse the manifest fields.

### Manifest Location

The manifest MUST be hosted at the Origin website's TLS-protected location: `https://[ORIGIN_URL]/xpoc-manifest.json`.

### XPOC URI

The manifest XPOC URI is the following string: `xpoc://[ORIGIN_URL]!`. The `xpoc://` prefix and terminating `!` character simplifies parser implementations. The Owner attaches the XPOC URI to a platform account page (for example, in its bio or profile page) or a content item it creates (for example, by including it in an item's metadata, label, or description).

## Example

The following section gives an example of a content owner Alex Example, who owns the `alexexample.com`, creating a XPOC manifest and content items.

### Setup

Alex creates a manifest and makes it available at `https://alexexample.com/xpoc-manifest.json`:

```json
{
    "name": "Alex Example",
    "baseurl": "alexexample.com",
    "updated": "2023-10-23T17:00:00Z",
    "version": "0.3",
    "accounts": [],
    "content": []
}
```

### Account linking

Alex adds their Facebook account name `alex.example` and their X/Twitter account name `@ExAlex` to their known accounts by adding the XPOC URI `xpoc://alexexample.com!` in their Facebook and X bio fields and by adding the following JSON objects to their manifest's `accounts` array:

```json
{
    "account": "alex.example",
    "platform": "Facebook",
    "url": "https://facebook.com/alex.example"
}
```

```json
{
    "account": "ExAlex",
    "platform": "X",
    "url": "https://twitter.com/ExAlex"
}
```

### Content creation

Alex's conference video is posted on YouTube at `https://www.youtube.com/watch?v=abcdef12345` under the account `@CoolConf` and have them add the XPOC URI `xpoc://alexexample.com!` in the video's description.

Alex then adds the following JSON object to their manifest's `content` array:

```json
{
    "account": "@CoolConf",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=abcdef12345",
    "desc": "My panel at the Cool conference",
    "puid": "abcde12345",
    "timestamp": "2023-08-24T08:45:00Z"
}
```

### Account validation

A verifier can check that a Facebook or X/Twitter account is indeed owned by `alexexample.com` by:

1. Parsing the XPOC URI on the account page to get the `alexexample.com` base URL,
2. Retrieving the XPOC manifest from `https://alexexample.com/xpoc-manifest.json`, and
3. Verifying that the account page is listed in the manifest's `accounts` property.

### Content validation

A verifier can check that the Youtube video posted by `@CoolConf` is indeed approved by the owner of `alexexample.com` by:

1. Parsing the XPOC URI to get the `alexexample.com` base URL,
2. Retrieving the XPOC manifest from `https://alexexample.com/xpoc-manifest.json`, and
3. Verifying that the video URL is listed in the manifest's `content` property.
