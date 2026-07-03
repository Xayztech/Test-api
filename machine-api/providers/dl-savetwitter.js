/** Twitter/X Downloader Scraper
 * Base : https://savetwitter.net
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Support Video/Image twitter post, quality hingga 1280p
 **/

const axios = require('axios');
const cheerio = require('cheerio');

async function savetwitter(url) {
    try {
        if (!url) throw new Error("Url Link Twitter yang ingin di unduh tidak ditemukan.");

        const payload = new URLSearchParams({
            q: url,
            lang: "id",
            cftoken: ""
        });

        const response = await axios.post("https://savetwitter.net/api/ajaxSearch", payload.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Accept": "*/*",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://savetwitter.net/id3"
            }
        });

        if (!response.data || !response.data.data) {
            throw new Error("Gagal mengambil data dari server hulu.");
        }

        const $ = cheerio.load(response.data.data);
        let videos = [];
        let image = null;

        $(".tw-button-dl").each((i, el) => {
            const text = $(el).text();
            const href = $(el).attr("href");

            if (!href || !href.startsWith("http")) return;

            if (text.includes("MP4")) {
                const match = text.match(/\((\d+)p\)/);
                const quality = match ? parseInt(match[1]) : 0;
                videos.push({ quality, url: href });
            }
        });

        $(".download-items__btn a").each((i, el) => {
            const href = $(el).attr("href");
            if (href && href.startsWith("http")) {
                image = href;
            }
        });

        videos.sort((a, b) => b.quality - a.quality);

        return {
            status: true,
            creator: "ONLym-Api",
            type: videos.length ? "video" : (image ? "image" : "unknown"),
            result: {
                id: url.split('/').pop()?.split('?')[0] || null,
                mp4: videos.length ? videos[0].url : null,
                all_qualities: videos,
                image: image
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

module.exports = { savetwitter };
