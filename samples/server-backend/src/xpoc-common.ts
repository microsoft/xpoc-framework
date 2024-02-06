// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

function showError(errMsg: string): void {
    const errMsgElem = document.getElementById('errorMsg') as HTMLElement;
    errMsgElem.textContent = errMsg;
    errMsgElem.style.display = 'block';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clearError(): void {
    const errMsgElem = document.getElementById('errorMsg') as HTMLElement;
    errMsgElem.textContent = '';
    errMsgElem.style.display = 'none';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isoToLocalTime(isoTime: string): string {
    if (!isoTime) {
        return '';
    }
    return new Date(isoTime).toLocaleString();
}

const prefix = '/fetchManifest?location=';

// fetch the xpoc manifest from the given base URL or XPOC URI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchXpocManifest(location: string): Promise<string | null> {
    let response;
    try {
        response = await fetch(`${prefix}${location}`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log('manifest fetch error', err);
        showError(`Error fetching a XPOC manifest at ${location}.`);
        return null;
    }
    return response.json();
}
