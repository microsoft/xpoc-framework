import axios from 'axios';

export async function validateManifest(domain: string): Promise<any> {
    try {
        const url = `https://${domain}/xpoc-manifest.json`;
        const response = await axios.get(url);
        return response.data; // Return the parsed manifest data.
    } catch (error) {
        throw new Error('No XPOC manifest found or error occurred fetching it.');
    }
    const url = `https://${domain}/xpoc-manifest.json`;
    const response = await axios.get(url);
    if (response.status < 200 || response.status > 299) {
        throw new Error(`Failed to fetch manifest. Status code: ${response.status}`);
    }
    return response.data;

}
