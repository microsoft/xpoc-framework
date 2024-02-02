import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { config } from 'dotenv';
import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript2';

/*
  This config supports two possible build scenarios:

  Chrome:
  - service worker background.js page, NO DOM access 
  - offscreen.js/html for DOM access
  - xpoc-lib.js is esm imported into offscreen.js

  Firefox:
  - non-persistent background.js page; DOM access
  - xpoc-lib.js is iife bundled into background.js
  - no need for offscreen.js/html


  Occasionally, when running rollup, you may get an error like this from rollup-plugin-typescript2:
  [!] (plugin rpt2) Error: EPERM: operation not permitted, rename

  Re-running rollup seems to fix it.
  I did not see a cause/solution at https://github.com/ezolenko/rollup-plugin-typescript2/issues

*/

// load the .env file
config();

const isDebug = process.env.NODE_ENV !== 'production';

const copyright = `/*!
*  Copyright (c) Microsoft Corporation.
*  Licensed under the MIT license.
*/`;

/*
  Common output options for all bundles
*/
const commonOutput = {
    format: 'esm',
    // in debug, we want to see the sourcemap inline to let chrome dev tools debug through the original TS source
    // using separate source map files did not work for me
    sourcemap: isDebug ? 'inline' : false,
    // put a copyright banner at the top of the bundle
    banner: isDebug ? undefined : copyright,
};

/*
  Common plugin options for all bundles
  - replace variables from .env with their values since the browser cannot access .env
  - bundle node modules (resolve)
  - convert commonjs modules to esm (commonjs)
  - minify the production bundle (terser)
  - compile typescript to javascript (typescript)
*/
const commonPlugins = [
    replace({
        preventAssignment: true, // This is a necessary option from Rollup v2.3.4 and above
        ...Object.keys(process.env).reduce((acc, key) => {
            acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
            return acc;
        }, {}),
    }),
    resolve({ browser: true }),
    commonjs(),
    // minify the bundle in production
    !isDebug &&
        terser({
            output: {
                comments: function (node, comment) {
                    // remove all comment except those starting with '!'
                    return comment.value.startsWith('!');
                },
            },
            compress: {
                drop_console: true,
                pure_funcs: [
                    'console.info',
                    'console.debug',
                    'console.warn',
                    'console.log',
                ],
            },
        }),
    typescript({
        tsconfig: 'tsconfig.json',
        clear: true,
    }),
];

/*
  Common error handler for all bundles
  - suppress circular dependency warnings in the production bundle
*/
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const commonWarningHandler = (warning, warn) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY' && !isDebug) return;
    warn(warning);
};

/*
  background.js (chrome)
*/
const background_chrome = {
    input: 'src/background.ts',
    output: {
        dir: 'dist/chrome',
        ...commonOutput,
    },
    plugins: [
        alias({
            // replace xpoc lib references with the proxy to offscreen.js
            entries: {
                './xpoc-lib.js': './xpoc-lib-proxy.js',
            },
        }),
        ...commonPlugins,
    ],
    onwarn: commonWarningHandler,
};

/*
  background.js (firefox)
*/
const background_firefox = {
    input: 'src/background.ts',
    output: {
        dir: 'dist/firefox',
        // keeps xpoc-ts-lib in a separate file instead of bundling it into background.js
        manualChunks: {
            'xpoc-ts-lib': ['xpoc-ts-lib'],
        },
        chunkFileNames: 'xpoc-ts-lib.js',
        ...commonOutput,
    },
    plugins: [...commonPlugins],
    onwarn: commonWarningHandler,
};

/*
  content.js
*/
const content = {
    input: 'src/content.ts',
    treeshake: {
        moduleSideEffects: [],
    },
    output: {
        file: 'dist/chrome/content.js',
        ...commonOutput,
        format: 'iife', // always iife as this code is injected into the page and not imported
    },
    plugins: commonPlugins,
    onwarn: commonWarningHandler,
};

/*
  popup.js
*/
const popup = {
    input: 'src/popup.ts',
    output: {
        file: 'dist/chrome/popup.js',
        ...commonOutput,
    },
    plugins: [
        copy({
            targets: [
                { src: 'public/popup.html', dest: 'dist/chrome' },
                { src: 'public/popup.css', dest: 'dist/chrome' },
            ],
        }),
        ...commonPlugins,
    ],
    onwarn: commonWarningHandler,
};

/*
  offscreen.js (for Chrome)
*/
const offscreen = {
    input: 'src/offscreen.ts',
    output: {
        dir: 'dist/chrome',
        // keeps xpoc-ts-lib in a separate imported file
        manualChunks: {
            'xpoc-ts-lib': ['xpoc-ts-lib'],
        },
        chunkFileNames: 'xpoc-ts-lib.js',
        ...commonOutput,
    },
    plugins: [
        copy({
            targets: [{ src: 'public/offscreen.html', dest: 'dist/chrome' }],
        }),
        ...commonPlugins,
    ],
    onwarn: commonWarningHandler,
};

/*
  When the chrome extension is built, we want to duplicate that folder and rename it to firefox
  And then, we want to copy the browser-specific manifests to their folders
  We append this to the last bundle
*/
const duplicateFirefox = copy({
    targets: [
        { src: 'public/icons', dest: 'dist/chrome' },
        { src: 'dist/chrome', dest: 'dist', rename: 'firefox' },
        {
            src: `manifest/chrome.json`,
            dest: 'dist/chrome',
            rename: 'manifest.json',
        },
        {
            src: `manifest/firefox.json`,
            dest: 'dist/firefox',
            rename: 'manifest.json',
        },
    ],
    // ensures the copy happens after the bundle is written so all files are available to copy
    hook: 'writeBundle',
});

// append the duplicateFirefox plugin to the last bundle
popup.plugins.push(duplicateFirefox);

// the order matters here
export default [
    background_chrome,
    content,
    offscreen,
    popup,
    background_firefox,
];
