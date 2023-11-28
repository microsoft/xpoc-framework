// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export async function getLocalStorage(key: string): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        chrome.storage.session.get([key], (data) => {
            if(data.hasOwnProperty(key) === false) {
                data[key] = {}
            }
            resolve(data);
        });
    });
}

export async function setLocalStorage(value: any): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.session.set( value, () => {
            resolve();
        });
    });
}
