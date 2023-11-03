import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace'
import 'dotenv/config'

const copyright = `/*!\n*  Copyright (c) Microsoft Corporation.\n*  Licensed under the MIT license.\n*/`

const plugins = [
    // replace process.env with values from .env file since we cannot use dotenv in browser
    replace({
        preventAssignment: true,
        ...Object.keys(process.env).reduce((acc, key) => {
            acc[`process.env.${key}`] = JSON.stringify(process.env[key])
            return acc
        }, {})
    }),
    json(),
    alias({
        // replace node html parser (cheerio) with browser html parser (DOMParser)
        entries: {
            './htmlParser.node.js': './htmlParser.browser.js'
        }
    }),
    resolve(),
    typescript({
        tsconfigOverride: {
            compilerOptions: {
                declaration: false, // no .d.ts files
                declarationMap: false, // no .d.ts.map files
            },
        },
    }),
    commonjs(),
    terser(),
]

export default [
    {
        input: 'src/bundle.ts', // your main TypeScript entry file
        treeshake: {
            moduleSideEffects: []
        },
        output: {
            name: 'xpoc',
            file: 'browser/xpoc.iife.min.js',
            format: 'umd',
            sourcemap: true,
            banner: copyright
        },
        plugins
    },
    {
        input: 'src/bundle.ts', // your main TypeScript entry file
        treeshake: {
            moduleSideEffects: []
        },
        output: {
            name: 'xpoc',
            file: 'browser/xpoc.esm.min.js',
            format: 'esm',
            sourcemap: true,
            banner: copyright
        },
        plugins
    }
]
