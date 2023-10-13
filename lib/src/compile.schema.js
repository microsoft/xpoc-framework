import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from "ajv/dist/standalone/index.js";
import fs from 'fs';
const schema = JSON.parse(fs.readFileSync('./schema/manifest.schema', 'utf-8'));
// we deliberately have to use esm:false here because ajv-formats doesn't respect the esm flag
// and puts commonjs imports into the generated code esm code.
// we'll keep the output as commonjs and let rollup convert it to esm.
const ajv = new Ajv({ schemas: [schema], code: { source: true, esm: false } })
addFormats(ajv, { esm: true })
let moduleCode = standaloneCode(ajv, {
    "Manifest": "#/definitions/Manifest"
})
fs.writeFileSync("./src/manifest.schema.js", moduleCode)
