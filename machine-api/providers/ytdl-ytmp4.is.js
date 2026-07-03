/** Youtube Downloader Fast
 * Base : https://ytmp4[dot]is
 * Author : ONLym-Api
 * Note : Video =  mp4 (720, 360)
 *        Audio = (320, 256, 192, 128, 64)
**/

const axios = require('axios');

function convertid(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function ytmp4is(url, format = 'mp4', customQuality = null) {
    try {
        const youtube_id = convertid(url);
        if (!youtube_id) throw new Error('URL YouTube tidak valid. Silakan masukkan tautan video yang benar.');

        const cleanFormat = format.toLowerCase().trim();

        const converter = await axios.post('https://ht.flvto.online/converter', 
            { id: youtube_id, fileType: cleanFormat },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
                    'Content-Type': 'application/json',
                    'origin': 'https://ht.flvto.online',
                    'referer': `https://ht.flvto.online/button?url=https://www.youtube.com/watch?v=${youtube_id}&fileType=${cleanFormat}`
                }
            }
        );

        const data = converter.data;
        if (!data || (data.status !== 'ok' && data.status !== 'success')) {
            throw new Error(data.msg || "Server flvto gagal memproses konversi.");
        }

        if (cleanFormat === 'mp3') {
            let targetQuality = customQuality ? String(customQuality).toLowerCase().replace('kbps', '') : '320';
            
            return {
                status: true,
                creator: "ONLym-Api",
                result: {
                    videoId: youtube_id,
                    title: data.title,
                    type: 'mp3',
                    quality: `${targetQuality}kbps`,
                    filesize: data.filesize || 0,
                    duration: data.duration || 0,
                    download_url: data.link
                }
            };
        }

        if (cleanFormat === 'mp4') {
            if (!Array.isArray(data.formats) || !data.formats.length) {
                throw new Error("Gagal mengekstrak daftar format resolusi video dari server.");
            }

            let targetQuality = customQuality ? String(customQuality).toLowerCase().replace('p', '') + 'p' : '720p';

            let selected = data.formats.find(v => v.qualityLabel === targetQuality);

            if (!selected) {
                const sorted = data.formats.sort((a, b) => b.height - a.height);
                selected = sorted[0];
            }

            return {
                status: true,
                creator: "ONLym-Api",
                result: {
                    videoId: youtube_id,
                    title: data.title,
                    type: 'mp4',
                    quality: selected.qualityLabel,
                    resolution: `${selected.width}x${selected.height}`,
                    fps: selected.fps || 30,
                    download_url: selected.url
                }
            };
        }

        throw new Error("Format tidak didukung. Gunakan 'mp3' atau 'mp4'.");

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.message
        };
    }
}

module.exports = { convertid, ytmp4is };
