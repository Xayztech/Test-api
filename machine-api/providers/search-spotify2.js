// Fitur Download pada web sengaja tidak di ambil karna ada turnstile tokennya.
const axios = require('axios');

/**
 * Spotify Search via Downloaderize API
 * @param {string} query - song title
 * @returns {object} result
 */
async function spotifysearch(query) {
    try {
        const response = await axios.get('https://api.downloaderize.com/api/search', {
            params: {
                q: query,
                type: 'track',
                limit: 30,
                offset: 0
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': 'https://spotify.downloaderize.com',
                'Referer': 'https://spotify.downloaderize.com/'
            }
        });

        const items = response.data?.results || [];
        
        return {
            status: true,
            query,
            total: response.data?.total || items.length,
            results: items.map(v => ({
                title: v.name,
                artist: v.subtitle,
                thumbnail: v.cover,
                url: v.url // URL internal referensi lagu
            }))
        };
    } catch (e) {
        return { status: false, msg: e.message };
    }
}

module.exports = { spotifysearch };
