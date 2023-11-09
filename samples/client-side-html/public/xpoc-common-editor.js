// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const currentVersion = "0.3";

function getCurrentIsoTime() {
    return new Date().toISOString().slice(0, "YYYY-MM-DDTHH:MM:SS".length) + 'Z';
}

function isoToLocalTime(isoTime) {
    if (!isoTime) {
        return '';
    }
    return new Date(isoTime).toLocaleString();
}

let manifest = {
    name: "",
    baseurl: "",
    updated: getCurrentIsoTime(),
    version: currentVersion,
    accounts: [],
    content: []
};

function showError(errMsg) {
    errMsgElem = document.getElementById('errorMsg');
    errMsgElem.textContent = errMsg;
    errMsgElem.style.display = 'block';
}

function clearError() {
    errMsgElem = document.getElementById('errorMsg');
    errMsgElem.textContent = '';
    errMsgElem.style.display = 'none';
}

function validateAndUpdateName(inputValue, inputElement) {
    clearError();
    inputValue = inputValue.trim();
    manifest.name = inputValue;
    // update value in the input field
    inputElement.value = inputValue;
}

function validateAndUpdateURL(inputValue, inputElement, contentType = 'info', index = 0) {
    clearError();
    inputValue = inputValue.trim();
    if (inputValue) {
        // value fields we can extract from an account or content URL
        let validatedURL = undefined;
        let accountName = undefined;
        let platformName = undefined;
        let puidValue = undefined;

        if (contentType === 'account') {
            // check if it is a supported platform account URL
            let platform = xpoc.Platforms.getPlatformFromAccountUrl(inputValue);
            if (platform) {
                data = platform.canonicalizeAccountUrl(inputValue);
                validatedURL = data.url;
                accountName = data.account;
                platformName = platform.DisplayName;
            }
        }
        if (contentType === 'content') {
            // check if it is a supported platform content URL
            let platform = xpoc.Platforms.getPlatformFromContentUrl(inputValue);
            if (platform) {
                data = platform.canonicalizeContentUrl(inputValue);
                validatedURL = data.url;
                accountName = data.account;
                puidValue = data.puid;
                platformName = platform.DisplayName;
            }
        }
        if (!validatedURL) {
            // not a URL from a supported platform, so just validate it
            validatedURL = inputValue; // initial value
            // prepend 'https://' if missing
            if (!/^https?:\/\//i.test(inputValue)) {
                validatedURL = 'https://' + inputValue;
            }
        }
        
        // validate the URL (platform canonicalization will have already done this,
        // but we do a final check here to catch any invalid URLs)
        // account and content URLs can have query params and anchor
        const nonDomainChars = "a-zA-Z0-9-_.!~*'();:@&=+$,";
        const fullUrl = contentType !== 'info';
        const fullUrlPattern = fullUrl ? `(\\?[${nonDomainChars}/%]+)?(#[a-zA-Z0-9-_.!~*'();:@&=+$,/%]+)?` : "";
        const validURLPattern = new RegExp(`^https:\\/\\/` + // https protocol
                                    `[a-zA-Z0-9.-]+` + // (sub)domain name
                                    `(\\.[a-zA-Z]{2,})` + // top level domain
                                    `(\\/[${nonDomainChars}]+(\\/[${nonDomainChars}]+)*)?\\/??` + // path
                                    `${fullUrlPattern}$`, "i"); // query params and anchor
        if (!validURLPattern.test(validatedURL)) {
            let urlField;
            if (contentType === 'info') {
                urlField = "owner's website";
            } else if (contentType === 'content') {
                urlField = "content URL";
            } else if (contentType === 'account') {
                urlField = "platform URL";
            }
            showError(`Please enter a valid base URL for the ${urlField}.`);
            return;
        }
        // update the manifest values
        let accountFieldIndex, platformFieldIndex, puidFieldIndex;
        if (contentType === 'info') {
            manifest.baseurl = validatedURL;
        } else if (contentType === 'content') {
            manifest.content[index].url = validatedURL;
            if (accountName) { manifest.content[index].account = accountName; }
            if (platformName) { manifest.content[index].platform = platformName; }
            if (puidValue) { manifest.content[index].puid = puidValue; }
        } else if (contentType === 'account') {
            manifest.accounts[index].url = validatedURL;
            if (accountName) { manifest.accounts[index].account = accountName; }
            if (platformName) { manifest.accounts[index].platform = platformName; }
        }
        // update value in the input field and other fields in the same row (if applicable)
        inputElement.value = validatedURL;
        if (accountName || platformName || puidValue) {
            let parentRow = inputElement.closest('tr');
            //let inputs = parentRow.querySelectorAll('input[type="text"]');
            if (accountName) { parentRow.querySelector('input[data-fieldname="account"]').value = accountName; }
            if (platformName) { parentRow.querySelector('input[data-fieldname="platform"]').value = platformName; }
            if (puidValue) { parentRow.querySelector('input[data-fieldname="puid"]').value = puidValue; }
        }
    }
}

function validateAndUpdateAccount(inputValue, inputElement, contentType = undefined, index = 0) {
    clearError();
    inputValue = inputValue.trim();
    let accountName = inputValue;
    // remove '@' prefix (if present)
    accountName = accountName.replace(/^@/, '');
    if (contentType === 'content') {
        manifest.content[index].account = accountName;
    } else if (contentType === 'account') {
        manifest.accounts[index].account = accountName;
    } else {
        // nothing to do
    }
    // update value in the input field
    inputElement.value = accountName;
}

function displayManifest() {
        // Update the update timestamp
        manifest.updated = getCurrentIsoTime();
        // Delete the accounts and content arrays if they are empty
        if (manifest.accounts.length === 0) {
            delete manifest.accounts;
        }
        if (manifest.content.length === 0) {
            delete manifest.content;
        }
        // Populate the textarea with the generated manifest and make it visible
        const manifestTextArea = document.getElementById('manifestTextArea');
        manifestTextArea.value = JSON.stringify(manifest, null, 2);
        manifestTextArea.style.display = 'block';
        // Enable the Save and Copy buttons
        document.getElementById('saveButton').disabled = false;
        document.getElementById('copyButton').disabled = false;
}

function saveManifest() {
    const manifestJson = document.getElementById('manifestTextArea').value;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(manifestJson);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "xpoc-manifest.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function copyToClipboard() {
    const textarea = document.getElementById('manifestTextArea');
    textarea.select();
    document.execCommand('copy');
}


