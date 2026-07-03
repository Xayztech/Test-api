const axios = require('axios');

async function spotidownloader(url, flac = false) {
    try {
        const id = url.match(/\/track\/([a-zA-Z0-9]+)/)?.[1];
        if (!id) throw new Error('Invalid Spotify Track URL.');
        if (typeof flac !== 'boolean') throw new Error('Flac must be a boolean.');
        
        const { data: cf } = await axios.post('https:/cf.rynekoo.eu.cc/action', {
            url: 'https://spotidownloader.com/en17',
            siteKey: '0x4AAAAAAA8QAiFfE5GuBRRS',
            mode: 'turnstile-min'
        });
        
        if (!cf?.data?.token) throw new Error('Failed to get cf token.');
        
        const inst = axios.create({
            baseURL: 'https://api.spotidownloader.com',
            headers: {
                origin: 'https://spotidownloader.com',
                referer: 'https://spotidownloader.com/en17',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        const { data: t } = await inst.post('/session', {
            token: cf.data.token
        });
        
        if (!t?.token) throw new Error('Failed to get token.');
        inst.defaults.headers.common['authorization'] = `Bearer ${t.token}`;
        
        const { data } = await inst.post('/download', {
            id: id,
            ...(flac && { flac: true })
        });
        
        return {
            metadata: {
                id: data.metadata.id,
                title: data.metadata.title,
                artists: data.metadata.artists,
                album: data.metadata.album,
                cover: data.metadata.cover,
                url: url
            },
            audio_url: data.link
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { spotidownloader };
