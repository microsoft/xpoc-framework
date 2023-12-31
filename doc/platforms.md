# Platform guidelines

The Cross-Platform Origin of Content (XPOC) framework is platform agnostic. In order to improve interoperability however, it is RECOMMENDED to follow these guidelines when creating entries in a manifest or adding XPOC URIs on the following platforms. 

List of platforms:
-   [Facebook](#facebook)
-   [GitHub](#github)
-   [Google Scholar](#google-scholar)
-   [Instagram](#instagram)
-   [LINE](#line)
-   [LinkedIn](#linkedin)
-   [Medium](#medium)
-   [Rumble](#rumble)
-   [Snapchat](#snapchat)
-   [Telegram](#telegram)
-   [Threads](#threads)
-   [TikTok](#tiktok)
-   [Vimeo](#vimeo)
-   [X (Twitter)](#x-twitter)
-   [YouTube](#youtube)

## Facebook

It is RECOMMENDED to only list Facebook accounts and not individual pieces of content (posts/photos/videos/reels) in the XPOC manifest.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Facebook"
    -   `account`: the owner's account name `<accountname>`
-   `accounts` properties:
    -   `url`: `https://www.facebook.com/<accountname>`
-   `content` properties:
    -   `url`: it is preferred to list the canonical `https://www.facebook.com/<accountname>/<type>/<fbid>` form, where `<type>` is `posts`, `photos`, `videos` or `reels`
    -   `puid`: the Facebook ID `<fbid>` of the item
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Intro field.
-    For a post: in a post's text field.

## GitHub

GitHub only supports account listing.

### Manifest content

-   `accounts` properties:
    -   `platform`: "GitHub"
    -   `account`: the owner's account name `<accountname>`
    -   `url`: `https://github.com/<accountname>`

GitHub does not support adding specific pieces of content.

### XPOC URI placement

-    On the account page: in the account page's Bio field.

## Google Scholar

Google Scholar only supports account listing.

### Manifest content

-   `accounts` properties:
    -   `platform`: "GoogleScholar"
    -   `account`: the owner's user identifier `<userid>`
    -   `url`: `https://scholar.google.com/citations?user=<userid>`

Google Scholar does not support adding specific pieces of content.

### XPOC URI placement

Google Scholar does not support adding XPOC URI on the account page.

## Instagram

It is RECOMMENDED to only list Instagram accounts and not individual pieces of content (posts/reels) in the XPOC manifest.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Instagram"
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: `https://www.instagram.com/<accountname>/`
-   `content` properties:
    -   `url`: it is preferred to list the canonical `https://www.instagram.com/<type>/<id>/` form, where `<type>` is `p` (for posts) or `reel`
    -   `puid`: the `<id>` from the `url`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Bio field.
-    For a post: in a post's caption field.

## LINE

LINE only offers in-app access, therefore XPOC manifests cannot link to account and content URLs. 

### Manifest content

-   `accounts` properties:
    -   `platform`: "LINE"
    -   `account`: the owner's LINE ID (without the `@`)
    -   `url`: n/a (leave empty)

### XPOC URI placement

Not applicable.

## LinkedIn

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "LinkedIn"
    -   `account`: the owner's account name `<accountname>`
-   `accounts` properties:
    -   `url`: `https://www.linkedin.com/<type>/@<accountname>/`, where `<type>` is `in` (for individuals), `school` or `company`
-   `content` properties:
    -   `url`: `https://www.linkedin.com/<type>/<title>/...` where `<type>` is `posts`, `events`, `pulse` or `learning`.
    -   `puid`: n/a
    -   `timestamp`: exact creation time in ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-   On the account page:
    -   For individuals: in the account page's About field
    -   For schools and companies: in the account page's Overview section. This will appear on the About page (`<url>/about/`) of the account.
-   For a post: in a post's text field.

## Medium

Medium accounts and specific stories can be added to a XPOC manifest.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Medium"
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: either the default `https://medium.com/@<accountname>/` form or the subdomain `https://<accountname>.medium.com` form (depending on the owner's account settings).
-   `content` properties:
    -   `url`: either the default `https://medium.com/@<accountname>/<title>-<id>` form or the subdomain `https://<accountname>.medium.com/<title>-<id>` form (depending on the account setting). This is preferred over using the `https://medium.com/p/<id>` short form; these can be used for unlisted stories.
    -   `puid`: the `<id>` from the `url`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: preferably in the account page's Bio field, optionally in the About page's description.
-    For a story: in the story's body, either at the top or the end.

## Rumble

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Rumble"
    -   `account`: the owner's channel name `<accountname>`
-   `accounts` properties:
    -   `url`: `https://rumble.com/c/<accountname>`
-   `content` properties:
    -   `url`: `https://rumble.com/<id>-<title>.html` where `<id>` is a 7-character alphanumeric string.
    -   `puid`: <id>
    -   `timestamp`: exact creation time in ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

- For individuals: in the user's channel Description field (per channel). This will appear on the About page (`<url>/about/`) of the account.
- For a post: in a video's tag field.

## Snapchat

Snapchat only offers in-app access, therefore XPOC manifests cannot link to account and content URLs. 

### Manifest content

-   `accounts` properties:
    -   `platform`: "Snapchat"
    -   `account`: the owner's username
    -   `url`: n/a (leave empty)

### XPOC URI placement

Not applicable.

## Telegram

Public Telegram accounts and channels can be added to a XPOC manifest; both are treated as XPOC "accounts".

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Telegram"
    -   `account`: the owner's account or channel name `<accountname>`
    -   `url`: the canonical `https://t.me/<accountname>` url is preferred; avoid using the URLs with opaque invitation parameters 

### XPOC URI placement

- For accounts: in the bio field
- For channels: in the description field.


## Threads

It is RECOMMENDED to only list Threads accounts and not individual pieces of content (posts) in the XPOC manifest.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "Threads"
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: `https://www.threads.net/@<accountname>`
-   `content` properties:
    -   `url`: `https://www.threads.net/@<accountname>/post/<id>`
    -   `puid`: the `<id>` from the `url`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Bio field.
-    For a post: in a post's field.

## TikTok

It is RECOMMENDED to only list TikTok accounts and not individual pieces of content (videos) in the XPOC manifest.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "TikTok"
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: `https://www.tiktok.com/@<accountname>`
-   `content` properties:
    -   `url`: `https://www.tiktok.com/@<accountname>/video/<id>`
    -   `puid`: the `<id>` from the `url`
    -   `timestamp`: exact creation time in ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Bio field.
-    For a video: in a video's caption field.

## Vimeo

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: `Vimeo`
    -   `account`: the owner's account name `<accountname>`
-   `accounts` properties:
    -   `url`: `https://vimeo.com/<accountname>`.
-   `content` properties:
    -   `url`: `https://vimeo.com/<videoID>`
    -   `puid`: `<videoID>`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Bio field.
-    On a video content page: in the video's description.

## X (Twitter)

It is RECOMMENDED to only list X (Twitter) accounts and not individual pieces of content (tweets) in the XPOC manifest. The owner can simply comment on a tweet to add a XPOC URI.

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: "X"
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: `https://twitter.com/<accountname>`
-   `content` properties:
    -   `url`: `https://twitter.com/<accountname>/status/<statusID>`
    -   `puid`: the `<statusID>` from the `url`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC.

### XPOC URI placement

-    On the account page: in the account page's Bio field. Note that a user's bio might appear in a side bar on the site (e.g., a "Relevant people" box), so validation tools should be aware that XPOC URIs might be displayed on a feed page but the corresponding manifest would list the person's account page. 
-    For a Tweet: in a post's or comment's text field.

## YouTube

### Manifest content

-   properties shared by `accounts` and `content`:
    -   `platform`: `YouTube`
    -   `account`: the owner's account name `<accountname>` (without the `@`)
-   `accounts` properties:
    -   `url`: `https://www.youtube.com/@<accountname>`.
-   `content` properties:
    -   `url`: `https://www.youtube.com/watch?v=<videoID>`
    -   `puid`: `<videoID>`
    -   `timestamp`: exact creation time in  ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ) in UTC. The time can be 00:00:00Z since YouTube only presents the date in its metadata.

### XPOC URI placement

-    On the account page: in the About page's description. This will appear on the About page (`<url>/about/`) of the account.
-    On a video content page: in the video's description.
