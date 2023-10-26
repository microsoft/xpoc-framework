// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

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

function isoToLocalTime(isoTime) {
    if (!isoTime) {
        return '';
    }
    return new Date(isoTime).toLocaleString();
}

// fetch the xpoc manifest from the given base URL or XPOC URI
async function fetchXpocManifest(location) {
    // if location is a XPOC URI (starts with xpoc://), replace the protocol with https:// and remove the trailing '!' (if present)
    location = location.replace(/^xpoc:\/\//, 'https://').replace(/!$/, '');
    // add a https:// prefix if the location doesn't have one
    if (!/^https?:\/\//i.test(location)) {
        location = 'https://' + location;
    }

    // create the full manifest url
    let url = new URL(location);
    url.pathname =
        (url.pathname.endsWith('/') ? url.pathname : url.pathname + '/') +
        'xpoc-manifest.json';

    let response;
    try {
        response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log('manifest fetch error', err);
        showError(`Error fetching a XPOC manifest at ${url.toString()}.`);
        return null;
    }
    return response.json();
}
