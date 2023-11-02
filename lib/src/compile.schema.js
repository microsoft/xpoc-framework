import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from "ajv/dist/standalone/index.js";
import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('./schema/manifest.schema', 'utf-8'));
const ajv = new Ajv({ schemas: [schema], code: { source: true, esm: false } })
addFormats(ajv)
let moduleCode = standaloneCode(ajv, {
    "Manifest": "#/definitions/Manifest"
})
/*
    TODO:
        There is an open ajv bug (https://github.com/ajv-validator/ajv-formats/issues/68) where, 
        when you include ajv-formats, the generated code will contain require statements
        even if you set esm to true. This is because ajv-formats doesn't respect the esm flag
        So we end up with mixed esm and commonjs code, which rollup/tsc doesn't like.

        So we compile the schema into commonjs, and let rollup convert it to esm.
*/

fs.writeFileSync("./src/manifest.schema.js", moduleCode)
