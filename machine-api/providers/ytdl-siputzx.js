const axios = require('axios');
const crypto = require('crypto');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const yts = require('yt-search');

const BASE_URL = 'https://youtubedl.siputzx.my.id';
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

function solvePow(challenge, difficulty) {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    while (true) {
        const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
        if (hash.startsWith(prefix)) return nonce.toString();
        nonce++;
    }
}

/**
 * Handler Utama untuk Mengunduh Berkas Media
 * @param {string} url - Tautan Video YouTube
 * @param {string} type - Tipe media ('audio' atau 'video')
 */
async function downloadVideo(url, type) {
    const initRes = await client.post(BASE_URL + '/akumaudownload', { url, type });
    const { challenge, difficulty } = initRes.data;

    const nonce = solvePow(challenge, difficulty);

    await client.post(BASE_URL + '/cekpunyaku', { url, type, nonce });

    while (true) {
        const { data } = await client.get(BASE_URL + '/download', { params: { url, type } });
        
        if (data.status === 'completed') {
            return BASE_URL + data.fileUrl;
        }
        if (data.status === 'failed') {
            throw new Error(data.error || 'Server gagal memproses konversi video.');
        }
        
        await new Promise(r => setTimeout(r, 3000));
    }
}

/**
 * Mengintegrasikan pencarian judul lagu dan otomatis mengambil unduhan audionya
 * @param {string} query - Judul lagu atau kata kunci pencarian
 */
async function play(query) {
    try {
        if (!query) throw new Error("Masukkan judul lagu atau kata kunci pencarian!");

        console.log('--- [ Memulai Pencarian YouTube ] ---');
        const searchResult = await yts(query);
        const video = searchResult.videos[0];

        if (!video) throw new Error("Video tidak ditemukan untuk kata kunci tersebut.");

        console.log("Judul     : " + video.title);
        console.log("Channel   : " + video.author.name);
        console.log("Durasi    : " + video.timestamp);
        console.log("Views     : " + video.views);
        console.log("Tautan    : " + video.url);
        console.log("Thumbnail : " + video.thumbnail);
        console.log('-------------------------------------');
        console.log('Sedang memproses unduhan audio, mohon tunggu...');

        const audioUrl = await downloadVideo(video.url, 'audio');

        return {
            status: true,
            creator: "ONLym-Api",
            metadata: {
                title: video.title,
                author: video.author.name,
                views: video.views,
                duration: video.timestamp,
                link: video.url,
                thumbnail: video.thumbnail
            },
            download_url: audioUrl
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.message
        };
    }
}

module.exports = { solvePow, downloadVideo, play };
