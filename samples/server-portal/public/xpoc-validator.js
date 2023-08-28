function fetchManifest() {
    let url = document.getElementById('urlInput').value;
    if (!url) {
        console.error("URL is empty");
        return;
    }
    // add https:// if not present (to create a valid URL object)
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    // extract the base URL (hostname + pathname)
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.hostname}${urlObj.pathname}`;

    fetch(`/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: baseUrl })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        displayManifest(data);
    })
    .catch(error => {
        console.error("Error fetching manifest:", error);
        if (error.error) { // TODO: Check if the error is a JSON error response from your server
            alert(error.error);
        }
    });
}

function displayManifest(manifestData) {
    const outputDiv = document.getElementById('output');
    
    let manifestHtml = `<div class="main-content"><h3>Manifest</h3><ul>`;
    manifestHtml += `<li><strong>Name:</strong> ${manifestData.name}</li>`;
    manifestHtml += `<li><strong>Base URL:</strong> ${manifestData.baseurl}</li>`;
    manifestHtml += "</ul></div>";

    let accountsHtml = `<div class="main-content"><h3>Accounts</h3><ul>`;
    manifestData.accounts.forEach(account => {
        accountsHtml += `<li>
            <strong>Platform:</strong> ${account.platform}<br>
            <strong>URL:</strong> <a href="${account.url}" target="_blank">${account.url}</a><br>
            <strong>Account:</strong> ${account.account}
        </li>`;
    });
    accountsHtml += "</ul></div>";

    let contentHtml = `<div class="main-content"><h3>Content</h3><ul>`;
    manifestData.content.forEach(item => {
        contentHtml += `<li>
            <strong>Title:</strong> ${item.title}<br>
            <strong>Account:</strong> ${item.account}<br>
            <strong>Platform:</strong> ${item.platform}<br>
            <strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a>
        </li>`;
    });
    contentHtml += "</ul></div>";

    outputDiv.innerHTML = manifestHtml + accountsHtml + contentHtml;
}
