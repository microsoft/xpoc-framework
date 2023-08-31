// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

document.addEventListener('DOMContentLoaded', function () {
    // Add event listeners to switch tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and tab contents
            tabs.forEach((t) => t.classList.remove('active'));
            tabContents.forEach((c) => c.classList.remove('active-content'));

            // Add active class to clicked tab and tab content
            tab.classList.add('active');
            const tabContentId = tab.getAttribute('data-tab');
            document
                .getElementById(tabContentId)
                .classList.add('active-content');
        });
    });
});
