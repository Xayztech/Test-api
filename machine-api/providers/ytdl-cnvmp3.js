/** Youtube Downloader Mp3/Mp4
 * Base : https://cnvmp3[dot]com
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : MP3/MP4 dengan kualitas 320k & 1080p otomatis save ke directory
 **/

const fs = require('fs');
const path = require('path');

const qualityvideo = ['144', '240', '360', '720', '1080'];
const qualityaudio = ['96', '128', '256', '320'];

function convertid(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function mapaudioquality(bitrate) {
    if (bitrate == 320) return 0;
    if (bitrate == 256) return 1;
    if (bitrate == 128) return 4;
    if (bitrate == 96) return 5;
    return 4;
}

async function request(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
            'origin': 'https://cnvmp3.com',
            'referer': 'https://cnvmp3.com/v55'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function downloadFile(fileUrl, fileName) {
    const filePath = path.join(process.cwd(), fileName);
    const writer = fs.createWriteStream(filePath);

    // Menangani domain CDN khusus berdasarkan log XHR eksternal jika URL berbentuk path relatif
    let finalDownloadUrl = fileUrl;
    if (fileUrl.startsWith('/')) {
        finalDownloadUrl = `https://apio8dlp.cnvmp3.online/downloads/download.php?file=${encodeURIComponent(fileUrl)}`;
    } else if (!fileUrl.startsWith('http')) {
        finalDownloadUrl = `https://apio8dlp.cnvmp3.online/downloads/download.php?file=${encodeURIComponent('/' + fileUrl)}`;
    }

    const response = await fetch(finalDownloadUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': 'https://cnvmp3.com/'
        }
    });

    if (!response.ok) throw new Error(`Gagal mengunduh biner file media dari CDN: ${response.status}`);

    const nodeStream = require('stream').Readable.fromWeb(response.body);
    nodeStream.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            reject(err);
        });
    });
}

async function cnvmp3(yturl, quality, format = 'mp3') {
    try {
        const youtube_id = convertid(yturl);
        if (!youtube_id) throw new Error('Format tautan URL YouTube tidak valid.');

        const formatValue = format.toLowerCase().trim() === 'mp4' ? 0 : 1;
        let finalQuality;

        if (formatValue === 0) {
            if (!qualityvideo.includes(String(quality))) throw new Error('Kualitas MP4 tidak valid.');
            finalQuality = parseInt(quality);
        } else {
            if (!qualityaudio.includes(String(quality))) throw new Error('Kualitas MP3 tidak valid.');
            finalQuality = mapaudioquality(parseInt(quality));
        }

        let finalLink;
        let title;

        const check = await request('https://cnvmp3.com/check_database.php', { 
            youtube_id, 
            quality: finalQuality, 
            formatValue 
        });

        // Penyesuaian fleksibel untuk membaca properti root objek database hulu sesuai log XHR
        if (check && check.success) {
            title = check.title || (check.data && check.data.title) || "Unknown Title";
            finalLink = check.server_path || (check.data && check.data.server_path) || check.path || "";
        } 
        
        if (!finalLink) {
            const yturlfull = `https://www.youtube.com/watch?v=${youtube_id}`;
            const viddata = await request('https://cnvmp3.com/get_video_data.php', { 
                url: yturlfull, 
                token: "1234" 
            });

            if (viddata.error) throw new Error(viddata.error);
            title = viddata.title;

            const download = await request('https://cnvmp3.com/download_video_ucep.php', {
                url: yturlfull,
                quality: finalQuality,
                title,
                formatValue
            });

            if (download.error) throw new Error(download.error);
            finalLink = download.download_link;

            await request('https://cnvmp3.com/insert_to_database.php', {
                youtube_id,
                server_path: finalLink,
                quality: finalQuality,
                title,
                formatValue
            });
        }

        if (!finalLink) throw new Error("Gagal mendapatkan path unduhan dari server konverter.");

        const safeFileName = `${title.replace(/[\\/:*?"<>|]/g, "").trim()}.${format.toLowerCase().trim()}`;
        await downloadFile(finalLink, safeFileName);

        return {
            status: true,
            creator: "ONLym-Api",
            result: {
                id: youtube_id,
                title: title,
                format: format.toLowerCase().trim(),
                quality: formatValue === 0 ? `${quality}p` : `${quality}kbps`,
                file_saved: safeFileName,
                local_path: path.join(process.cwd(), safeFileName)
            }
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.message
        };
    }
}

module.exports = { convertid, mapaudioquality, request, downloadFile, cnvmp3 };
