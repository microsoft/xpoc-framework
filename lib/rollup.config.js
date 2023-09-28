import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/bundle.ts', // your main TypeScript entry file
    output: {
        name: 'xpoc',
        file: 'browser/xpoc.min.js',
        format: 'iife',
        sourcemap: true,
    },
    external: ['fs'],
    plugins: [
        json(),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    declaration: false, // no .d.ts files
                    declarationMap: false, // no .d.ts.map files
                },
            },
        }),
        resolve({ browser: true }), // resolve modules from node_modules
        commonjs(), // converts CommonJS to ES modules
        terser(), // minify the output
    ],
    onwarn: (warning, warn) => {
        // suppress certain warnings from node's fs module
        if (warning.code === 'MISSING_NODE_BUILTINS') return;
        warn(warning);
    },
};
