const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

async function spotmate(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid url.');
        
        const ip = [10, crypto.randomInt(256), crypto.randomInt(256), crypto.randomInt(256)].join('.');
        const inst = axios.create({
            baseURL: 'https://spotmate.online',
            headers: {
                origin: 'https://spotmate.online',
                referer: 'https://spotmate.online/en1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
                'x-forwarded-for': ip,
                'x-originating-ip': ip,
                'x-remote-ip': ip,
                'x-remote-addr': ip,
                'x-forwarded-host': ip,
                'x-connecting-ip': ip,
                'client-ip': ip,
                'x-client-ip': ip,
                'x-real-ip': ip,
                'x-forwarded-for-original': ip,
                'x-forwarded': ip,
                'x-cluster-client-ip': ip,
                'x-original-forwarded-for': ip
            }
        });
        
        inst.interceptors.response.use(res => {
            const cookies = res.headers['set-cookie'];
            if (cookies?.length) inst.defaults.headers.common['cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
            return res;
        });
        
        const { data: html } = await inst.get('/');
        const $ = cheerio.load(html);
        
        const csrf = $('meta[name="csrf-token"]').attr('content');
        if (!csrf) throw new Error('Csrf token not found.');
        inst.defaults.headers.common['x-csrf-token'] = csrf;
        
        let [{ data: meta }, { data: aud }] = await Promise.all([
            inst.post('/getTrackData', {
                spotify_url: url
            }),
            inst.post('/convert', {
                urls: url
            })
        ]);
        
        return {
            metadata: meta,
            audio_url: aud.url
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { spotmate };
