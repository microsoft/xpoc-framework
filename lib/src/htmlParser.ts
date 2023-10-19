// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

type QueryObject = {
    nodeQuery: string;
    attribute?: string;
};

export async function query(url: string, queries: QueryObject[]): Promise<(string | undefined)[] | Error> {
    throw new Error("query not implemented");
}