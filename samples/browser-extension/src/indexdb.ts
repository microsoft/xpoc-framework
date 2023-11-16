// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "dotenv/config";

const DB_NAME = chrome.runtime.id;
const STORE_NAME = 'DOCUMENTS';
const DB_VERSION = 1;
const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? `${1000 * 60 * 60 * 24 /*1 day*/}`)

let db: IDBDatabase

interface databaseEntry {
    url: string;
    html: string;
    timestamp: number;
}


/**
 * The function `openDB` is an asynchronous function that opens an IndexedDB database 
 * If the database does not exist, it creates a new database
 * @returns The function returns a Promise that resolves to an `IDBDatabase` object
 */
async function openDB(): Promise<IDBDatabase> {
    if (db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
        return db;
    }
    return new Promise((resolve, reject) => {
        const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event: Event) => reject('Database error: ' + (event.target as any)?.errorCode);
        request.onsuccess = async (event: Event) => {
            db = (event.target as any).result;
            resolve(db);
        };
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            db = (event.target as any).result as IDBDatabase;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'url' });
            }
        };
    });
}


/**
 * Asynchronously stores a URL and its corresponding HTML content in a database.
 * @param {string} url - URL of the HTML document to store.
 * @param {string} html - HTML content to store.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function store(url: string, html: string): Promise<void> {
    await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ url, html, timestamp: Date.now() } as databaseEntry);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error);
        }
    });
}


/**
 * Retrieves an HTML document from a database using the specified URL.
 * @param {string} url - URL of the HTML documents to retrieve.
 * @returns {Promise<string | undefined>} Promise that resolves to the retrieved HTML as a string, or undefined if not found.
 */
export async function get(url: string): Promise<string | undefined> {
    await openDB();
    await deleteExpiredEntries()
    return new Promise((resolve, _reject) => {
        const transaction = db.transaction([STORE_NAME]);
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);
        request.onsuccess = () => {
            if (!request.result) { return resolve(undefined) }
            const html = (request.result as databaseEntry).html
            resolve(html)
        };
        request.onerror = () => resolve(undefined);
    });
}


/**
 * Deletes entries from a database that have expired based on a given timestamp.
 * @returns {Promise<void>} A promise that resolves once the deletion is complete.
 */
async function deleteExpiredEntries(): Promise<void> {
    if (!db) { return; }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const expirationThreshold = Date.now() - CACHE_TTL; // Calculate the oldest acceptable timestamp

    return new Promise((resolve, reject) => {
        store.openCursor().onsuccess = (event: Event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const timestamp = cursor.value.timestamp;
                if (timestamp < expirationThreshold) {
                    store.delete(cursor.primaryKey);
                }
                cursor.continue(); // calls .onsuccess again with the next cursor object, or null if no more entries
            }
        };
        transaction.oncomplete = () => resolve()
        transaction.onerror = (event: Event) => reject((event.target as IDBRequest).error);
    })
}
