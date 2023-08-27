"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManifest = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const platform_1 = require("./platform");
dotenv_1.default.config();
const platformDataFetchers = {
    youtube: platform_1.Youtube.getData,
    twitter: platform_1.Twitter.getData,
};
async function createManifest(url, platform, existingManifest, title, desc, account) {
    const dataFetcher = platformDataFetchers[platform];
    if (!dataFetcher) {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    const platformData = await dataFetcher(url);
    existingManifest.content.push({
        timestamp: new Date().toISOString(),
        title: platformData.title,
        desc: '',
        url,
        platform: platformData.platform,
        puid: platformData.puid,
        account,
    });
    return existingManifest;
}
exports.createManifest = createManifest;
//# sourceMappingURL=xpoc.js.map