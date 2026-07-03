const axios = require('axios');

async function spodownloader(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid url.');
        
        const { data: cf } = await axios.post('https://cf.rynekoo.eu.cc/action', {
            url: 'https://spodownloader.com/',
            siteKey: '0x4AAAAAACwvH6E3RfmLvWG2',
            mode: 'turnstile-min'
        });
        
        if (!cf?.data?.token) throw new Error('Failed to get cf token.');
        
        const inst = axios.create({
            baseURL: 'https://media.fabdl.com',
            headers: {
                origin: 'https://spodownloader.com',
                referer: 'https://spodownloader.com/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        const { data: meta } = await inst.get('/spotify/get', {
            headers: {
                'x-cf-token': cf.data.token
            },
            params: {
                url: url
            }
        });
        
        const { data } = await inst.get(meta.result.get_download_url);
        const aud = data.result.audios.find(m => m.format === 'mp3')?.url;
        if (!aud) throw new Error('No result found.');
        
        return {
            metadata: {
                id: meta.result.id,
                title: meta.result.name,
                artists: meta.result.artists,
                cover: meta.result.image,
                url: url
            },
            audio_url: 'https://media.fabdl.com' + aud
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { spodownloader };
