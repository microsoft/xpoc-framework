/*
*  Copyright (c) Microsoft Corporation.
*  Licensed under the MIT license.
*/

const autoVerifyXpocUris = document.getElementById('auto-verify-xpoc-uri-toggle') as HTMLInputElement

chrome.storage.local.get(['autoVerifyXpocUris'], (result) => {
  autoVerifyXpocUris.checked = result === undefined ? false : result.autoScanQrCodes
})

autoVerifyXpocUris.addEventListener('change', () => {
  console.log('autoVerifyXpocUris changed')

  chrome.storage.local.set({ autoVerifyXpocUris: autoVerifyXpocUris.checked }, () => {
      console.log('autoVerifyXpocUris is set to ' + autoVerifyXpocUris.checked)
  })
})
