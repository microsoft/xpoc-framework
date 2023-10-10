// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const currentVersion = "0.2";

let manifest = {
    name: "",
    baseurl: "",
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
    validatedURL = inputValue;
    // prepend 'https://' if missing
    if (!/^https?:\/\//i.test(inputValue)) {
        validatedURL = 'https://' + inputValue;
    }
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
    if (contentType === 'info') {
        manifest.baseurl = validatedURL;
    } else if (contentType === 'content') {
        manifest.content[index].url = validatedURL;
    } else if (contentType === 'account') {
        manifest.accounts[index].url = validatedURL;
    }
    // update value in the input field
    inputElement.value = validatedURL;
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
        // Populate the textarea with the generated manifest and make it visible
        const manifestTextArea = document.getElementById('manifestTextArea');
        manifestTextArea.value = JSON.stringify(manifest, null, 2);;
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


