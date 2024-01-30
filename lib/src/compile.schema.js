import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('./schema/manifest.schema', 'utf-8'));
const ajv = new Ajv({ schemas: [schema], code: { source: true, esm: false } });
addFormats(ajv);
let moduleCode = standaloneCode(ajv, {
    Manifest: '#/definitions/Manifest',
});
/*
    TODO:
        There is an open ajv bug (https://github.com/ajv-validator/ajv-formats/issues/68) where, 
        when you include ajv-formats, the generated code will contain require statements
        even if you set esm to true. This is because ajv-formats doesn't respect the esm flag
        So we end up with mixed esm and commonjs code, which rollup/tsc doesn't like.
        Our workaround is to manually remove the require statements and replace them with imports.

    This:
        exports.Manifest = validate10;
        ...
        const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;
        const formats4 = require("ajv-formats/dist/formats").fullFormats["date-time"];

    Becomes this:
        import * from Formats from \"ajv-formats/dist/formats\";
        export { validate10 as Manifest };
        ...
        const formats0 = Formats.fullFormats.uri;
        const formats4 = Formats.fullFormats["date-time"];

    Note:
        ts-jest requires we use the 'import * as' syntax

*/

moduleCode =
    '/* eslint-disable */\n' +
    moduleCode
        .replace(
            /exports.Manifest\s*=\s*validate(\d+);/,
            'import * as Formats from "ajv-formats/dist/formats.js";export { validate$1 as Manifest };',
        )
        .replace(/require\("ajv-formats\/dist\/formats"\)./g, 'Formats.');

fs.writeFileSync('./src/manifest.schema.js', moduleCode);
