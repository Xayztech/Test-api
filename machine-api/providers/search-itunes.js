const axios = require('axios');

function toAppleMusicUrl(trackViewUrl, trackId) {
    if (!trackViewUrl) return null;
    try {
        const u = new URL(trackViewUrl);
        const origin = 'https://music.apple.com';
        const path = u.pathname;
        const params = new URLSearchParams();
        if (trackId) params.set('i', String(trackId));
        params.set('uo', '4');
        return `${origin}${path}?${params.toString()}`;
    } catch {
        return null;
    }
}

async function searchAppleMusic(query) {
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://itunes.apple.com/search',
            params: {
                term: query,
                media: 'music',
                entity: 'song',
                limit: 5
            }
        });

        const songs = (response.data.results || []).map(item => ({
            trackId: item.trackId || null,
            title: item.trackName || null,
            artist: item.artistName || null,
            album: item.collectionName || null,
            preview_url: item.previewUrl || null,
            apple_url: toAppleMusicUrl(item.trackViewUrl, item.trackId) || item.trackViewUrl || null
        }));

        return {
            status: true,
            creator: "ONLym-Api",
            result: songs
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.message
        };
    }
}

module.exports = { toAppleMusicUrl, searchAppleMusic };
