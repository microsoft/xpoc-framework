# Implementing Cross-Origin HTML Rendering in Chrome Extensions
Our goal is to enable a Chrome/Firefox extension to search remote web pages for specific content. Since web pages can dynamically render elements using scripts post-load, simply downloading and searching the HTML is insufficient. We must fully render the page within the extension, then search this rendered content.

This requires two key components:
- A mechanism to render cross-origin HTML.
- Access to the rendered HTML document.

There are two methods to render an HTML page within an extension:
- Opening a new browser tab.
- Utilizing an IFrame linked to an existing document.

The 'new tab' method is less preferred, as it creates a new, user-visible tab with no option for concealment. Therefore, we opt for the IFrame approach.

However, IFrames present certain security risks:
- They can be used by harmful web pages to load and extract sensitive information from other sites, like a logged-in banking site.
- Malicious code within an IFrame might break out and compromise the parent page.

By design, the document of a cross-origin IFrame is inaccessible to the parent page. To overcome this, we inject a script into the IFrame. This script utilizes a message-passing interface to relay the rendered HTML back to the parent page. This approach, while effective, bypasses IFrame security, necessitating strict control to ensure the IFrame’s document remains exclusive to the extension and not the web page in the tab.

We can establish an IFrame linked to a document in three places:
1) In the extension's background page (`offscreen.js` for Chrome, `background.js` for Firefox).
2) Directly in the tab (`content.js`).
3) Within a background HTML page housed in its own IFrame.

<br>

## Strategies for IFrame URL Rendering and Document Extraction
Rendering a URL in an IFrame and extracting its document can be achieved through various methods, each with specific limitations.

### Method 1: Assign Raw HTML to IFrame's srcdoc in Background Script
- The IFrame's `.srcdoc` attribute sets its origin to null.
- Cross-origin restrictions block src attributes of scripts, stylesheets, and images in Firefox.
- Injecting a `<base>` element works in Chrome but causes security errors in Firefox.
- Absolute URL updates for src attributes lead to cross-origin issues in Firefox.
- Firefox has strict security for `srcdoc` (unlike Chrome), often resulting in partial rendering with errors.

### Method 2: Set Remote URL to IFrame's src in Background Script
- This method correctly loads the remote URL into the IFrame.
- Script injection targeting a specific IFrame requires a tabId, available only in the main tab.
- Other script injection techniques risk injecting scripts into all IFrames, posing a security threat.
- A potential solution involves the injected script posting messages to the parent under specific, safe conditions.

### Method 3: Assign Remote URL to IFrame's src in Content Script
- This approach successfully loads the remote URL into the IFrame.
- The script injection can specifically target this IFrame.
- The injected script must use `parent.postMessage()` to send the document object.
- The parent tab listens for this message to retrieve the document.
- This method compromises IFrame security, as any code might intercept the message.

### Method 4: Use a Nested IFrame within a web_accessible_resources IFrame
- Loads a web_accessible_resources page of the extension.
- This page then creates an IFrame, loading the desired remote URL.
- The script injection targets the nested IFrame.
- This approach fails in Firefox because the nested IFrame lacks host permissions as a child of the web_accessible_resources IFrame.

### Method 5: Encrypt IFrame HTML for Exclusive Extension Decryption
- Loads the remote URL into the IFrame effectively.
- Allows targeted script injection into the specific IFrame.
- The injected script encrypts the document with a key known only to the extension.
- The script uses `parent.postMessage()` to send the encrypted document.
- The parent tab receives the encrypted document, but cannot access the decryption key.
- The content script decrypts the document, isolating it from the parent tab.
- While complex, this method is effective and secure.

We employ Method 5 for both Chrome and Firefox, as it ensures document protection from the parent tab.

Method 5 is works for Chrome and Firefox and protects the document from the parent Tab. It is the method we use.

<br>

## Managing Header Filtering for IFrame Rendering
When dealing with pages that have headers preventing IFrame loading (like `X-Frame-Options: DENY`), we can circumvent this using the `declarativeNetRequest` API in the background script. This API allows us to intercept and modify headers.

To specifically target only those IFrames intended for HTML rendering, we apply a dynamic approach:
1. We add a temporary rule to the `declarativeNetRequest` API, tailored to intercept headers for a designated IFrame.
2. Once the IFrame loads, we remove this rule.

Given the absence of conditions in the API to directly target a specific IFrame, we employ a unique strategy:
- We attach a random query string to the URL of the IFrame we're constructing.
- The rule in the `declarativeNetRequest` API is then set to match only IFrames with this unique query string.
- This ensures that only our intended IFrame is affected, as other tabs or IFrames cannot predict or replicate this unique string.

While there's a potential concern that servers might reject requests with these unexpected query strings, our testing has shown no such issues. This method effectively allows us to selectively bypass restrictive headers for specific IFrames without impacting others or exposing them to potential misuse.

<br>

## Usage
Deploy the listener in the background script and call the download function in the content script.


background.js
```js
import { downloadDocumentListener } from './renderHtml.js'
downloadDocumentListener()
```

content.js
```js
import { downloadDocument } from "./renderHtml.js";
const document = await downloadDocument('https://www.google.com')
```
