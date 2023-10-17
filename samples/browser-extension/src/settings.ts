// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/*
    For the extension bundle, we replace all the process.env.* values at bundle time.
    We don't actually need to load the .env file at runtime.
    However, for local development and possibly testing, we would.
    So, we leave dotenv config() here for now.

    import { config } from 'dotenv'
    config()
*/

const DEFAULT_PROTOCOL = 'http'
const DEFAULT_HOST = 'localhost'
const DEFAULT_ISSUER_PORT = '8080'
const DEFAULT_VERIFIER_PORT = '8081'

const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL

// issuer settings
export const ISSUER_HOST = process.env.ISSUER_HOST ?? DEFAULT_HOST
export const ISSUER_PORT = process.env.ISSUER_PORT ?? DEFAULT_ISSUER_PORT
export const ISSUER_URL = `${PROTOCOL}://${ISSUER_HOST}:${ISSUER_PORT}`
export const ISSUANCE_SUFFIX = '/issue'
export const JWKS_SUFFIX = '/.well-known/jwks.json'

// verifier settings
export const VERIFIER_HOST = process.env.VERIFIER_HOST ?? DEFAULT_HOST
export const VERIFIER_PORT = process.env.VERIFIER_PORT ?? DEFAULT_VERIFIER_PORT
export const VERIFIER_URL = `${PROTOCOL}://${VERIFIER_HOST}:${VERIFIER_PORT}`
export const PRESENTATION_SUFFIX = '/verify'
