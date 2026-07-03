/** Scrape Downloader Instagram
* Base : https://downloadgram[dot]org
* Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
* Author : ONLym-Api
* Note : menggunakan Cors Siputzx, Output Url download saja.
**/

const axios = require('axios');

const PROXY = 'https://cors.siputzx.my.id';

async function downloadGram(url) {
    try {
        const payload = new URLSearchParams({
            url: url,
            v: '3',
            lang: 'en'
        }).toString();

        const { data } = await axios.post(`${PROXY}/https://api.downloadgram.org/media`, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://downloadgram.org',
                'Referer': 'https://downloadgram.org/',
                'Accept': '*/*'
            }
        });

        if (!data || typeof data !== 'string') {
            throw new Error('Server hulu tidak mengembalikan respons teks valid.');
        }

        const cleanHtml = data
            .replace(/\\x20/g, ' ')
            .replace(/\\x22/g, '"')
            .replace(/\\/g, '');

        const regexCdn = /href="(https:\/\/cdn\.downloadgram\.org\/[^"\s>]+)"/gi;
        const urls = [];
        let match;

        while ((match = regexCdn.exec(cleanHtml)) !== null) {
            urls.push(match[1]);
        }

        const uniqueUrls = [...new Set(urls)];

        if (uniqueUrls.length === 0) {
            const fallbackRegex = /(https:\/\/cdn\.downloadgram\.org\/[^"\s>)]+)/gi;
            while ((match = fallbackRegex.exec(cleanHtml)) !== null) {
                urls.push(match[1]);
            }
        }

        return {
            success: true,
            results: [...new Set(urls)]
        };

    } catch (error) {
        return { 
            success: false, 
            msg: error.response ? JSON.stringify(error.response.data) : error.message 
        };
    }
}

module.exports = { downloadGram };
