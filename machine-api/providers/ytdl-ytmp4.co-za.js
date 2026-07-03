const axios = require('axios');
const crypto = require('crypto');

const MASTER_KEY_HEX = 'C5D58EF67A7584E4A29F6C35BBC4EB12';

function decryptPayload(encryptedBase64) {
    const dataBuffer = Buffer.from(encryptedBase64, 'base64');
    const iv = dataBuffer.slice(0, 16);
    const ciphertext = dataBuffer.slice(16);
    const key = Buffer.from(MASTER_KEY_HEX, 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

const youtubeSearch = async (query) => {
    if (typeof (query) !== "string" || query.length === 0) throw Error(`invalid query`)
    const body = {
        "context": {
            "client": {
                "hl": "en",
                "gl": "ID",
                "clientName": "WEB",
                "clientVersion": "2.20250701.09.00",
            },
        },
        "params": "EgIQAQ%3D%3D",
        query
    };
    const response = await axios.post('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', body, {
        headers: { "Accept-Encoding": "gzip, deflate, br, zstd" }
    });
    const result = response.data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
        .filter(v => v?.videoRenderer?.lengthText?.simpleText).map(v => {
            const vr = v.videoRenderer;
            return { videoId: vr.videoId, title: vr.title.runs[0].text };
        });
    if (result.length === 0) throw Error(`tidak bisa menemukan video dari keyword ${query}`);
    return result;
};

const extractVideoId = (input) => {
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
};

module.exports = { decryptPayload, youtubeSearch, extractVideoId };
