"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateManifest = void 0;
const axios_1 = __importDefault(require("axios"));
async function validateManifest(domain) {
    try {
        const url = `https://${domain}/xpoc-manifest.json`;
        const response = await axios_1.default.get(url);
        return response.data; // Return the parsed manifest data.
    }
    catch (error) {
        throw new Error('No XPOC manifest found or error occurred fetching it.');
    }
    const url = `https://${domain}/xpoc-manifest.json`;
    const response = await axios_1.default.get(url);
    if (response.status < 200 || response.status > 299) {
        throw new Error(`Failed to fetch manifest. Status code: ${response.status}`);
    }
    return response.data;
}
exports.validateManifest = validateManifest;
//# sourceMappingURL=validator.js.map