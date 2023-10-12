# Frequently Asked Questions

Frequently asked questions about the Cross-Platform Origin of Content (XPOC) platform.

## What does XPOC stand for?

It stands for Cross-Platform Origin of Content.

## Is XPOC free?

Yes, the Cross-Platform Origin of Content (XPOC) framework is an open specification with a companion open source reference implementation, both released under a [MIT License](../LICENSE).

## How can I deploy XPOC on my website?

Deploying XPOC on your website is as simple as creating a `xpoc-manifest.json` in your website's root folder, listing your associated account names (e.g., user names, social handles, etc.) and content items (e.g., posts, videos, etc.). See the [specification](./xpoc-specification.md) for the manifest format.

Using one of the [sample implementations](../README.md#using-the-sample-implementations), you can create and edit a manifest using the XPOC editor portal.

## How can I verify XPOC-protected content?

There are two mechanisms to verify XPOC-protected content:

1. By inspecting a content owner's XPOC manifest (located on their website at `https://<baseurl>/xpoc-manifest.json`) to discover their associated accounts on various platforms (e.g., YouTube, X/Twitter, Facebook, etc.) and specific content items (e.g., posts, videos, etc.), or
2. By dereferencing a XPOC URI on a platform account or content page to locate the owner's XPOC manifest and verify if the XPOC resource is indeed listed in the manifest.

Using one of the [sample implementations](../README.md#using-the-sample-implementations), you can do the former by using the XPOC viewer portal (by entering the owner's website), and the later by using the verifier portal (by entering a resource URI) or the web browser extension (by right-clicking on a XPOC URI).

## How is the content protected using XPOC?

XPOC confirms that an account is linked to a known website, and that a piece of content is hosted at a correct location. It does not protect the content in isolation and in particular, it doesn't guarantee the digital integrity of the content using cryptographic mean. Such attacks would break the threat model of most hosting platforms (e.g., an attacker can't change the content of a YouTube video or a X/Twitter post), and if required, digital authentication techniques (such as provided by [C2PA](https://c2pa.org/)) could be used in addition to XPOC to provide additional content protection.

## What is a XPOC URI?

A XPOC URI is a string starting with `xpoc://` prefix followed by a base url (a hostname (domain) followed by an optional path) and a terminating `!` character. The prefix helps validators to recognize XPOC resources on a HTML page. A XPOC validator fetches the XPOC manifest by replacing the `xpoc://` prefix with `https://`, removing the terminating `!` character, and appending `/xpoc-manifest.json` to the URI.

## Can a piece of content be associated with more than one XPOC URI?

Yes. A piece of content (e.g., a video, a podcast) could be posted by a 3rd party (e.g., an interviewer, a host, a journalist), and content collaborators and participants can add this item to their own manifest to express their approval or authorized participation. As an example, if Alice and Bob both participate in a conference panel that is posted on the YouTube channel of the conference (that they don't own), then can add (or asked the channel owner to add) their personal XPOC URI to the video description.

## What's the difference with C2PA?

The [Coalition for Content Provenance and Authenticity (C2PA)](https://c2pa.org/) specifies how to attest to the origin and integrity of various media content types (e.g., pictures, videos) by attaching manifest containing cryptographic signatures (for data creation and updates) to the media files. To provide these strong guarantees, C2PA requires the deployment of a PKI to validate the identity of the content creators and editors. XPOC on the other hand simply links external platform accounts and contents to an origin website, using transport layer security (i.e., control of a web domain). One would need the collaboration of the hosting platforms to verify a C2PA manifest (e.g., an end user doesn't see the signature of a YouTube video, YouTube itself would need to validate it); in contrast XPOC can be self hosted and used without the collaboration of content platforms.

## Can someone link to _my_ accounts and content in _their_ manifest?

Yes, nothing prevents someone from including accounts they don't own and content they did not create in their manifest, just like they could in the HTML of their website. Digital authentication of content would be required to prevent this; this is out-of-scope for the XPOC framework, but is addressed for example by the [Coalition for Content Provenance and Authenticity (C2PA)](https://c2pa.org/).

XPOC aims at solving the opposite problem: preventing someone from maliciously attributing accounts and content to you.

## Can implementers contribute to the XPOC framework?

Implementers can build, port to different languages, or localize XPOC-compatible components (such as manifest editors/creators, validation tools, and platform integration modules) by following the XPOC framework [specification](./xpoc-specification.md), the reference implementation and the samples.

## How can I integrate the XPOC framework on my platform?

Media hosting platforms can improve their account validation and content filtering by validating XPOC artifacts. Platforms can explicitly add a XPOC URI field in their account (profile, bio) page, and display it in a user-friendly manner in the account’s UI. Alternatively, a platform could make it possible to enter the URI in a generic description field, and render it in HTML to allow validation tools to discover and parse it correctly.

Platforms could parse the XPOC URI directly and use it as part of their account confirmation and content filtering systems, and reflect it in their UI (e.g., with a verified origin badge). Alternatively, the platform could try to fetch a XPOC manifest from a user’s “website” field if available.

Platforms could improve the user experience by creating APIs to automatically retrieve the XPOC information to include in a manifest (for content creators) or to verify (for validation tools).
