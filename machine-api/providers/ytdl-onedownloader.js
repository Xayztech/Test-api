/* Scrape Downloader Youtube Downloader
* Base : https://onedownloader[dot]net
* Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
* Author : ONLym-Api
* Note : Video : mp4, webm, mkv = 4k, 2k, 1080p, 720p, 480p, 360p, 144p
         Audio : mp3 (320k, 256k, 192k, 128k, 64k) 
                 wav, opus, m4a, ogg, flac (128k)
         Support Download video/audio 3 jam
*/

const axios = require('axios');

async function checkStatus(statusUrl) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(async () => {
            try {
                if (Date.now() - startTime > 60000) {
                    clearInterval(interval);
                    return reject(new Error('Timeout waiting for download processing.'));
                }

                const { data } = await axios.get(statusUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://onedownloader.net/',
                        'Accept': 'application/json'
                    }
                });

                if (data?.status === 'completed' || data?.downloadUrl) {
                    clearInterval(interval);
                    resolve(data);
                } else if (data?.status === 'failed') {
                    clearInterval(interval);
                    reject(new Error('Server processing failed.'));
                }
            } catch (err) {
                clearInterval(interval);
                reject(err);
            }
        }, 3000);
    });
}

async function onedl(url, format = 'mp4', quality = '1080p') {
    try {
        if (!url.includes('https://')) throw new Error('Invalid url.');

        const fmt = format.toLowerCase();
        const isAudio = ['mp3', 'wav', 'opus', 'm4a', 'ogg', 'flac'].includes(fmt);
        const isCustomAudioQuality = fmt === 'mp3';

        const payload = {
            url: url,
            os: "windows",
            output: {
                type: isAudio ? "audio" : "video",
                format: fmt,
                quality: isAudio ? (isCustomAudioQuality ? quality.toLowerCase() : "128k") : quality.toLowerCase()
            },
            audio: {
                bitrate: isCustomAudioQuality ? quality.toLowerCase() : "128k"
            }
        };

        const { data } = await axios.post('https://hub.convert1s.com/api/download', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://onedownloader.net',
                'Referer': 'https://onedownloader.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        if (!data?.statusUrl) {
            throw new Error('Gagal menginisiasi pembuatan link unduhan.');
        }

        const finalResult = await checkStatus(data.statusUrl);

        return {
            status: true,
            title: finalResult.title,
            duration: finalResult.duration,
            thumbnail: finalResult.thumbnail,
            download_url: finalResult.downloadUrl
        };
    } catch (error) {
        return { status: false, msg: error.message };
    }
}

module.exports = { checkStatus, onedl };
