function fetchManifest() {
    const url = document.getElementById('urlInput').value;
    if (!url) {
        console.error("URL is empty");
        return;
    }

    fetch(`/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: new URL(url).hostname })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });  // This handles JSON error responses
        }
        return response.json();
    })
    .then(data => {
        displayManifest(data);
    })
    .catch(error => {
        console.error("Error fetching manifest:", error);
        if (error.error) { // Check if the error is a JSON error response from your server
            alert(error.error);
        }
    });
}

function displayManifest(manifestData) {
    const outputDiv = document.getElementById('output');
    
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

    outputDiv.innerHTML = accountsHtml + contentHtml;
}
