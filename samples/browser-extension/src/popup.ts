// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type xpocResultSet } from "./background";
import { getLocalStorage } from "./storage";
import { type lookupXpocUriResult } from "./xpoc-lib";
import { OriginInfo, getOriginInfo, getOriginSource, OriginSourceData, setOriginDataSource, OriginSource } from "./origin";

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

      // refresh the origin source in the option tab
      if (tabContentId === 'options') {
        const originSource = getOriginSource()
        console.log('originSource obtained in options tab', originSource)
        if (originSource) {
          displayOriginDataSourceInfo(originSource)
        }
      }
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

autoVerifyXpocUris.addEventListener('change', async () => {
  console.log('autoVerifyXpocUris changed')
  const checked = autoVerifyXpocUris.checked
  chrome.storage.local.set({ autoVerifyXpocUris: checked }, async () => {
    const activeTab = await getActiveTab()
    if (activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action: "autoScanUpdated", autoScan: checked });
    }
    console.log('autoVerifyXpocUris is set to ' + checked)
  })
})

const originInfoInput = document.getElementById('origin-data-source-input') as HTMLInputElement

originInfoInput.addEventListener('change', function (event) {
  const eventTarget = event.target as HTMLInputElement
  if (eventTarget.files && eventTarget.files.length > 0) {
    const file = eventTarget.files[0]
    // read the file
    const reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = function (evt) {
      // parse the file contents as JSON
      const json = JSON.parse(evt?.target?.result as string) as OriginSourceData
      try {
        // set the origin source
        const source = setOriginDataSource(json)
        console.log(`source loaded: ${source.name}`)

        displayOriginDataSourceInfo(source)
      }
      catch (e) {
        console.log(`Invalid origin data source: ${e}`)
      }
    }
  } else {
    console.log("No file selected")
  }
});

function displayOriginDataSourceInfo(source: OriginSource) {
  console.log('displayOriginDataSourceInfo called, source:' + source.name)
  // display the source info
  const sourceInfo = document.getElementById('origin-data-source-info') as HTMLDivElement
  sourceInfo.style.display = 'block'
  sourceInfo.innerHTML = `
      <p>Origin Data Source: <a href="${source.website}" target="_blank">${source.name}</a></p>
      <p><a href="${source.website}" target="_blank"><img src="${source.logo}" alt="${source.name}" width="100"></a></p>
    `
}

/**
 * The function `getXpocResultsForCurrentTab` retrieves XPoC results from local storage for the current
 * tab's URL.
 * @returns an array of objects, where each object has a key-value pair. The key is a string
 * representing an xpocUri, and the value is a lookupXpocUriResult.
 */
async function getXpocResultsForCurrentTab(): Promise<{ [xpocUri: string]: lookupXpocUriResult }[]> {
  const storageObj = await getLocalStorage('xpocResults') as { xpocResults: xpocResultSet } ?? { xpocResults: {} }
  const currentTabUrl = await getActiveTabUrl().catch(() => '')
  if (!currentTabUrl || !storageObj || !storageObj.xpocResults) {
    return []
  }
  const obj = storageObj.xpocResults[currentTabUrl]
  if (!obj) {
    return []
  }
  return Object.keys(obj).map(key => ({ [key]: obj[key] }));
}

async function getResultsInfoForCurrentTab(): Promise<OriginInfo | undefined> {
  return getOriginInfo(await getActiveTabUrl())
}

/**
 * Gets the URL of the currently active tab.
 * @returns a Promise that resolves to a string.
 */
async function getActiveTabUrl(): Promise<string> {
  return getActiveTab().then((tab) => {
    return tab.url as string
  }).catch(() => '')
}

/**
 * Gets the currently active tab.
 * @returns a Promise that resolves to a Tab.
 */
async function getActiveTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        reject("No active tab found.");
      }
    });
  });
}

async function showResults() {
  // check for XPOC result
  const originInfo = document.getElementById('origin-info') as HTMLDivElement
  const xpocResults = await getXpocResultsForCurrentTab()
  if (xpocResults.length > 0) {
    // hide the 'no-origin' div
    const noOrigin = document.getElementById('no-origin') as HTMLDivElement
    noOrigin.style.display = 'none'

    // show the origin info div
    originInfo.style.display = 'block'

    // clear the origin info div
    originInfo.innerHTML = ''

    // we only show the first result (TODO: handle multiple; could be the same one, need to make more robust)
    const xpocResult = Object.values(xpocResults[0])[0] as lookupXpocUriResult
    console.log(`xpoc result: ${xpocResult.type}`)
    if (xpocResult.type === 'account' || xpocResult.type === 'content') {
      let account = ''
      let platform = ''
      let prefix = ''
      let baseurl = `https://${xpocResult.baseurl}`
      let url = `${baseurl}/xpoc-manifest.json`
      if (xpocResult.type == 'account') {
        account = xpocResult.account.account
        platform = xpocResult.account.platform
        prefix = `${platform} account "${account}"`
      } else if (xpocResult.type == 'content') {
        account = xpocResult.content.account
        platform = xpocResult.content.platform
        prefix = `${platform} content posted by "${account}"`
      }
      const resultDiv = document.createElement('div')
      resultDiv.classList.add('result')
      if (xpocResult) {
        resultDiv.innerHTML = `
          <div class="xpoc-result-info">
            ${prefix} found in ${xpocResult.name}'s <a href="${url}" target="_blank">manifest</a> at <a href="${baseurl}" target="_blank">${xpocResult.baseurl}</a><br>
          </div>
        `
      }
      originInfo.appendChild(resultDiv)
    }
  }

  // check for origin info

  const originResults = await getResultsInfoForCurrentTab()
  if (originResults) {
    console.log("originResults available for popup", originResults)
    // hide the 'no-origin' div
    const noOrigin = document.getElementById('no-origin') as HTMLDivElement
    noOrigin.style.display = 'none'

    // show the origin info div
    originInfo.style.display = 'block'

    // clear the origin info div
    originInfo.innerHTML = ''

    const resultDiv = document.createElement('div')
    resultDiv.classList.add('result')

    const source = getOriginSource()
    if (source) {
      console.log("originResults", originResults)
      console.log("source", source)
      const pageType = originResults.platform === 'Website' ? 'website' : `${originResults.platform} page`
      resultDiv.innerHTML = `
            <div class="source-result-info">
              <p>This is ${originResults.name}'s ${pageType}.<p>
              <p>Source: <a href="${originResults.refUrl}" target="_blank">${source.name}</a></p>
              <p><a href="${source.website}" target="_blank"><img src="${source.logo}" alt="${source.name}" width="100"></a></p>
            </div>
          `
      originInfo.appendChild(resultDiv)
    }
  } else {
    console.log('no origin info found')
  }
}
