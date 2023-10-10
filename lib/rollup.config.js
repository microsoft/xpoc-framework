import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import alias from '@rollup/plugin-alias';

const plugins = [
    json(),
    alias({
        // replace node html parser (cheerio) with browser html parser (DOMParser)
        entries: {
            './htmlParser.node.js': './htmlParser.browser.js'
        }
    }),
    typescript({
        tsconfigOverride: {
            compilerOptions: {
                declaration: false, // no .d.ts files
                declarationMap: false, // no .d.ts.map files
            },
        },
    }),
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts CommonJS to ES modules
    {
        // rollup leaves fs module in the bundle, this removes it
        name: 'remove-fs-import',
        renderChunk(code) {
            return {
                code: code.replace(/import 'fs';\n?/, ''),
                map: null  // no source map adjustment
            };
        }
    },
    terser(), // minify the output
]

const onwarn = (warning, warn) => {
    // suppress certain warnings from node's fs module
    if (warning.code === 'MISSING_NODE_BUILTINS') return;
    warn(warning);
}

export default [
    {
        input: 'src/bundle.ts', // your main TypeScript entry file
        output: {
            name: 'xpoc',
            file: 'browser/xpoc.iife.min.js',
            format: 'umd',
            sourcemap: true,
        },
        // external: ['fs'],
        plugins,
        onwarn
    },
    {
        input: 'src/bundle.ts', // your main TypeScript entry file
        output: {
            name: 'xpoc',
            file: 'browser/xpoc.esm.min.js',
            format: 'esm',
            sourcemap: true,
        },
        // external: ['fs'],
        plugins,
        onwarn
    }
]
