import fs from 'fs';
import { Option, Command } from 'commander';
import { XPOCManifest } from './manifest'

interface Options {
    path: string,
    url: string,
    idx: string,
    puid: string
}

const program = new Command();
program.requiredOption('-p, --path <path>', 'path to the manifest to update or create');
program.option('-u, --url <url>', 'search for url in manifest');
program.option('-i, --idx <idx>', 'search for idx in manifest');
program.option('-p, --puid <puid>', 'search for puid in manifest');
program.parse(process.argv)
const options: Options = program.opts()

const compare = (a: string, b: string) => a.toLowerCase() === b.toLowerCase(); 

// return a base URL without http(s) scheme, query params and anchors
const getBaseUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        const baseUrl = (urlObj.origin + urlObj.pathname).replace(/https:\/\//, '').replace(/http:\/\//, '').replace(/\/$/, '').toLowerCase();
        return baseUrl;
    } catch (error) {
        throw new Error(`Can't parse URL: ${url}`);
    }
}

void (async () => {
    try {
        // make sure one search option is set
        if (!options.idx && !options.puid && !options.url) {
            throw "Need to specify a search option";
        }
        // parse the manifest
        const manifest = JSON.parse(fs.readFileSync(options.path, 'utf8')) as XPOCManifest;
        // search the manifest
        const content = manifest.content.filter(c => {
            if (options.idx) {
                return compare(c.idx, options.idx);
            } else if (options.puid) {
                return compare(c.puid, options.puid);
            } else if (options.url) {
                return compare(getBaseUrl(c.url), getBaseUrl(options.url));
            }
        })
        // print search matches
        content.forEach(content => console.log(content));
    } catch (err) {
        console.log(err)
    }
})()