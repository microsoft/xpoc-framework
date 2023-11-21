// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type xpocResultSet } from "./background";
import { getLocalStorage } from "./storage";
import { type lookupXpocUriResult } from "./xpoc-lib";

document.addEventListener('DOMContentLoaded', function (): void {
  // Add event listeners to switch tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and tab contents
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active-content'));

      // Add active class to clicked tab and tab content
      tab.classList.add('active');
      const tabContentId = tab.getAttribute('data-tab') ?? '';
      document
        .getElementById(tabContentId)
        ?.classList.add('active-content');
    });
  });
  showResults().then(() => {
    console.log('results shown')
  })
});

const autoVerifyXpocUris = document.getElementById('auto-verify-xpoc-uri-toggle') as HTMLInputElement

chrome.storage.local.get(['autoVerifyXpocUris'], (result) => {
  autoVerifyXpocUris.checked = !!result?.autoVerifyXpocUris
})

autoVerifyXpocUris.addEventListener('change', () => {
  console.log('autoVerifyXpocUris changed')
  chrome.storage.local.set({ autoVerifyXpocUris: autoVerifyXpocUris.checked }, () => {
    console.log('autoVerifyXpocUris is set to ' + autoVerifyXpocUris.checked)
  })
})


/**
 * The function `getXpocResultsForCurrentTab` retrieves XPoC results from local storage for the current
 * tab's URL.
 * @returns an array of objects, where each object has a key-value pair. The key is a string
 * representing an xpocUri, and the value is a lookupXpocUriResult.
 */
async function getXpocResultsForCurrentTab(): Promise<{ [xpocUri: string]: lookupXpocUriResult }[]> {
  const storageObj = await getLocalStorage('xpocResults') as { xpocResults: xpocResultSet }
  const currentTabUrl = await getActiveTabUrl().catch(() => '')
  if (!currentTabUrl) {
    return []
  }
  const obj = storageObj.xpocResults[currentTabUrl]
  return Object.keys(obj).map(key => ({ [key]: obj[key] }));
}

/**
 * Gets the URL of the currently active tab.
 * @returns a Promise that resolves to a string.
 */
async function getActiveTabUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (tabs.length > 0 && tabs[0].url) {
        resolve(tabs[0].url);
      } else {
        reject("No active tab or URL found.");
      }
    });
  });
}


async function showResults() {
  const results = document.getElementById('results') as HTMLDivElement
  const xpocResults = await getXpocResultsForCurrentTab()
  xpocResults.forEach((result) => {
    const xpocUri = Object.keys(result)[0]
    const xpocUriResult = result[xpocUri]
    const resultDiv = document.createElement('div')
    resultDiv.classList.add('result')
    resultDiv.innerHTML = `
      <div class="xpoc-uri">${xpocUri}</div>
      <div class="xpoc-uri-result">${JSON.stringify(xpocUriResult, null, 3)}</div>
    `
    results.appendChild(resultDiv)
  })
}
