// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Ajv from 'ajv';
import { XPOCManifest } from './manifest';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv)

const manifestSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string'
        },
        baseurl: {
            type: 'string'
        },
        version: {
            type: 'string'
        },
        accounts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    account: {
                        type: 'string'
                    },
                    platform: {
                        type: 'string'
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                        pattern: "^https://"
                    }
                },
                required: ['account', 'platform', 'url']
            }
        },
        content: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    account: {
                        type: 'string'
                    },
                    platform: {
                        type: 'string'
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                        pattern: "^https://"
                    },
                    desc: {
                        type: 'string'
                    },
                    puid: {
                        type: 'string'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                required: ['account', 'platform', 'url']
            }
        },
    },
    required: ['name', 'baseurl', 'version', 'accounts', 'content']
};

const validate = ajv.compile(manifestSchema);

export function validateManifest(manifest: XPOCManifest): { valid: boolean, errors?: string[] } {
    const valid = validate(manifest);
    if (valid) return { valid: true };
    const errors: string[] = validate.errors?.map((err) => `${err.instancePath}: ${err.message}` ?? '') ?? [];
    return { valid: false, errors };
}
