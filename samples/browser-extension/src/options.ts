/*
*  Copyright (c) Microsoft Corporation.
*  Licensed under the MIT license.
*/

const ISSUER_URL = "http://localhost:8080"
const VERIFIER_URL = "http://localhost:8081"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regexUrl = /^https?:\/\/([a-zA-Z0-9.-]+)(:[0-9]{1,5})?(\/S*)?$/

const inputIssuer = document.getElementById('issuerUrl') as HTMLInputElement
const inputVerifier = document.getElementById('verifierUrl') as HTMLInputElement
const buttonSubmit = document.getElementById('buttonSubmit') as HTMLButtonElement

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
buttonSubmit.addEventListener('click', function (event) {
  event.preventDefault()

  console.log('Saving Urls')

  const issuerUrl = (document.getElementById('issuerUrl') as HTMLInputElement)?.value
  const verifierUrl = (document.getElementById('verifierUrl') as HTMLInputElement)?.value

  // Save to chrome.storage or browser.storage
  chrome.storage.local.set({
    issuerUrl,
    verifierUrl
  }, function () {
    console.log('Urls saved')
    window.close()
  })
})

chrome.storage.local.get(['issuerUrl', 'verifierUrl'], function (items) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  (document.getElementById('issuerUrl') as HTMLInputElement)!.value = items.issuerUrl ?? ISSUER_URL
  if (items.issuerUrl === '') {
    chrome.storage.local.set({
      issuerUrl: ISSUER_URL
    }, () => { verifyUrl() })
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  (document.getElementById('verifierUrl') as HTMLInputElement)!.value = items.verifierUrl ?? VERIFIER_URL
  if (items.verifierUrl === '') {
    chrome.storage.local.set({
      verifierUrl: VERIFIER_URL
    }, () => { verifyUrl() })
  }
})

inputIssuer.addEventListener('input', verifyUrl)
inputVerifier.addEventListener('input', verifyUrl)

function verifyUrl (): void {
  if (regexUrl.test(inputIssuer.value) && regexUrl.test(inputVerifier.value)) {
    buttonSubmit.disabled = false
    buttonSubmit.value = 'Save'
  } else {
    buttonSubmit.disabled = true
    buttonSubmit.value = 'Invalid Url'
  }
}
