/** Youtube Downloader mp3 & mp4
 * Base : v22[dot]www-y2mate[dot]com
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Video =  mp4 (1080p, 720p, 480p, 360p, 240p, 144p)
          Audio = (320, 256, 128)
 **/

const axios = require('axios');

async function y2mate(input) {
    try {
        let [query, qualityInput] = input.split(",");
        let targetLink = query.trim();
        
        let cleanQuality = qualityInput ? qualityInput.trim().toLowerCase().replace(/kbps|p/g, '') : '128';

        if (!/^https?:\/\//i.test(targetLink)) {
            const searchPayload = new URLSearchParams();
            searchPayload.append('search_query', targetLink);

            const searchRes = await axios.post('https://search.nnmn.store/', searchPayload.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Origin': 'https://v22.www-y2mate.com',
                    'Referer': 'https://v22.www-y2mate.com/'
                }
            });

            if (!searchRes.data || !searchRes.data.items || !searchRes.data.items.length) {
                return { status: 404, message: "Video tidak ditemukan." };
            }

            targetLink = 'https://youtu.be/' + searchRes.data.items[0].id;
        } else {
            const matchId = targetLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/);
            if (matchId) targetLink = 'https://youtu.be/' + matchId[1];
        }

        const metaRes = await axios.get('https://www.youtube.com/oembed', {
            params: { url: targetLink, format: 'json' },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://frame.y2meta-uk.com/'
            }
        });
        const meta = metaRes.data;

        const keyRes = await axios.get('https://cnv.cx/v2/sanity/key', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://frame.y2meta-uk.com/',
                'Origin': 'https://frame.y2meta-uk.com'
            }
        });
        const { key } = keyRes.data;

        let format = "mp3";
        let audioBitrate = "128";
        let videoQuality = "720"; 

        const mp4Qualities = ["144", "240", "360", "720", "1080"];
        const mp3Qualities = ["128", "256", "320"];

        if (mp4Qualities.includes(cleanQuality)) {
            format = "mp4";
            videoQuality = cleanQuality;
            audioBitrate = "128"; 
        } else if (mp3Qualities.includes(cleanQuality)) {
            format = "mp3";
            audioBitrate = cleanQuality;
            videoQuality = "720"; 
        }

        const body = new URLSearchParams({
            link: targetLink,
            format: format,
            audioBitrate: audioBitrate,
            videoQuality: videoQuality,
            filenameStyle: "pretty",
            vCodec: "h264"
        });

        const convRes = await axios.post('https://cnv.cx/v2/converter', body.toString(), {
            headers: {
                'Key': key,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Origin': 'https://frame.y2meta-uk.com',
                'Referer': 'https://frame.y2meta-uk.com/'
            }
        });

        const conv = convRes.data;

        return {
            status: 200,
            creator: "ONLym-Api",
            type: format,
            quality: format === "mp3" ? audioBitrate + "kbps" : videoQuality + "p",
            title: meta.title,
            author: meta.author_name,
            thumbnail: meta.thumbnail_url,
            filename: conv.filename,
            download: conv.url,
            source: targetLink
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.response
        };
    }
}

module.exports = { y2mate };
