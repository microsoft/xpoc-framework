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

function validateAndUpdateURL(inputValue, inputElement) {
    clearError();
    inputValue = inputValue.trim();
    validatedURL = inputValue;
    // if it doesn't start with 'http://' or 'https://', prepend 'https://'
    if (!/^https?:\/\//i.test(inputValue)) {
        validatedURL = 'https://' + inputValue;
    }

    const validURLPattern = /^https:\/\/[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})(\/[\w.-\/]*)?$/i;
    if (!validURLPattern.test(validatedURL)) {
        showError("Please enter a valid base URL for the owner's website.");
        return;
    }

    manifest.baseurl = validatedURL;
    // update value in the input field
    inputElement.value = validatedURL;
}

function validateAndUpdateAccount(inputValue, inputElement) {
    clearError();
    inputValue = inputValue.trim();
    // remove leading '@' if present
    if (inputValue.startsWith('@')) {
        inputValue = inputValue.substring(1);
    }
    // update value in the input field
    inputElement.value = inputValue;
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


