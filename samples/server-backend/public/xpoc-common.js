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

// fetch the xpoc manifest from the given base URL or XPOC URI
async function fetchXpocManifest(location) {
    try {
        const response = await fetch(`/fetchManifest?location=${encodeURIComponent(location)}`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const jsonResponse = await response.json();
        console.log('fetchManifest response', jsonResponse);
        return jsonResponse;
    } catch (err) {
        console.log('fetchManifest error', err);
        showError(`Error fetching a XPOC manifest from ${location}`);
        return null;
    }
}

async function isSupportedPlatformResource(resource) {
    let url = new URL(resource);
    try {
        const response = await fetch(`/isSupportedPlatformResource?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const jsonResponse = await response.json();
        console.log('isSupportedPlatformResource response', jsonResponse);
        return jsonResponse.isSupported;
    } catch (err) {
        console.log('isSupportedPlatformResource error', err);
        showError(`Error checking if resource is supported: ${url.toString()}.`);
        return false;
    }    
}

async function canFetchPlatformResource(resource) {
    let url;
    try {
        url = new URL(resource);
    } catch (err) {
        console.log('canFetchPlatformResource error', err);
        showError(`Can't parse URL: ${resource}.`);
        return false;
    }
    try {
        const response = await fetch(`/canFetchPlatformResource?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error('Response not ok');
        }
        const jsonResponse = await response.json();
        console.log('canFetchPlatformResource response', jsonResponse);
        return jsonResponse.canFetch;
    } catch (err) {
        console.log('canFetchPlatformResource error', err);
        showError(`Error checking if we can fetch resource: ${url.toString()}.`);
        return false;
    }
}