// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export async function getLocalStorage(
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [key: string]: any }> {
    return new Promise((resolve) => {
        chrome.storage.session.get([key], (data) => {
            if (data.hasOwnProperty(key) === false) {
                data[key] = {};
            }
            resolve(data);
        });
    });
}

export async function setLocalStorage(value: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.session.set(value, () => {
            resolve();
        });
    });
}
