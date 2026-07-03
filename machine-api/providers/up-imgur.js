const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');

async function uploadToImgur(buffer, filename) {
    const form = new FormData();
    form.append('image', buffer, { filename: filename });

    const { data } = await axios.post('https://uploadimgur.com/api/upload', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'https://uploadimgur.com',
            'Referer': 'https://uploadimgur.com/',
            'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    if (!data.link) throw new Error('Upload failed');
    return data.link;
}

module.exports = { uploadToImgur };
