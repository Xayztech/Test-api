// library zencf sudah gak work jadi fix sendiri.

const axios = require('axios');
const FormData = require('form-data');
const { zencf } = require('zencf');

async function waifu2x(image, { style = 'artwork', noice = 'medium', upscaling = '1.6x' } = {}) {
    try {
        const conf = {
            style: {
                artwork: 'art',
                scans: 'art_scan',
                photo: 'photo'
            },
            noice: {
                none: '-1',
                low: '0',
                medium: '1',
                high: '2',
                highest: '3'
            },
            upscaling: {
                none: '-1',
                '1.6x': '1',
                '2x': '2'
            }
        };
        
        if (!Buffer.isBuffer(image)) throw new Error('Image must be a buffer.');
        if (!conf.style[style]) throw new Error(`Available styles: ${Object.keys(conf.style).join(', ')}.`);
        if (!conf.noice[noice]) throw new Error(`Available noices: ${Object.keys(conf.noice).join(', ')}.`);
        if (!conf.upscaling[upscaling]) throw new Error(`Available upscaling options: ${Object.keys(conf.upscaling).join(', ')}.`);
        
        const { token } = await zencf.turnstileMin(
            'https://www.waifu2x.net/', 
            '0x4AAAAAABqlY7DKXMzoS81U'
        );

        const form = new FormData();
        form.append('recap', '');
        form.append('turnstile', token);
        form.append('url', '');
        form.append('file', image, `${Date.now()}_rynn.jpg`);
        form.append('style', conf.style[style]);
        form.append('noice', conf.noice[noice]);
        form.append('scale', conf.upscaling[upscaling]);
        form.append('format', '0');
        form.append('cf-turnstile-response', '');
        
        const { data } = await axios.post('https://www.waifu2x.net/api', form, {
            headers: {
                ...form.getHeaders(),
                origin: 'https://www.waifu2x.net',
                referer: 'https://www.waifu2x.net/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            },
            responseType: 'arraybuffer'
        });
        
        return Buffer.from(data);
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { waifu2x };
