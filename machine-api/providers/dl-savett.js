/** Tiktok Downloader Scraper
 * Base Converter : https://savett[dot]cc
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Output = all stats, thumbnail, profile pic, no watermark, watermark, mp3 
          Support Tiktok Slide dan Tiktok Stories
 **/

const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
};


async function expandUrl(shortUrl) {
    try {
        const res = await axios.head(shortUrl, {
            headers,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });
        return res.request._redirectable?._currentUrl || shortUrl;
    } catch {
        return shortUrl;
    }
}

async function getTokens() {
    const res = await axios.get('https://savett.cc/en1/', { headers });
    const rawCookies = res.headers['set-cookie'] || [];
    const cookie = rawCookies.map(v => v.split(';')[0]).join('; ');
    const csrf = res.data.match(/name="csrf_token"\s+value="([^"]+)"/)?.[1];
    return { csrf, cookie };
}

async function savett(inputUrl) {
    try {
        if (!inputUrl) throw new Error("Link nya mana wokk");

        const targetUrl = await expandUrl(inputUrl.trim());

        const { csrf, cookie } = await getTokens();
        if (!csrf) throw new Error("Gagal mengamankan token CSRF pendaratan awal.");

        const detailPayload = new URLSearchParams({
            csrf_token: csrf,
            url: targetUrl
        });

        const detailResponse = await axios.post('https://savett.cc/en1/download', detailPayload.toString(), {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://savett.cc',
                'Referer': 'https://savett.cc/en1/',
                'Cookie': cookie
            }
        });

        const $ = cheerio.load(detailResponse.data);

        const innerCsrf = $('input[name="csrf_token"]').val() || detailResponse.data.match(/csrf_token\s*=\s*"([^"]+)"/)?.[1];

        const extractedStats = { views: "0", likes: "0", bookmarks: "0", comments: "0", shares: "0" };
        
        $('#video-info .my-1 svg').each((_, el) => {
            const fillColor = $(el).attr('fill');
            const valueText = $(el).next('span.text-secondary').text().trim() || "0";
            
            if (fillColor === '#17a2b8') extractedStats.views = valueText;
            if (fillColor === '#ff0000') extractedStats.likes = valueText;
            if (fillColor === '#ffc107') extractedStats.bookmarks = valueText;
            if (fillColor === '#28a745') extractedStats.comments = valueText;
            if (fillColor === '#007bff') extractedStats.shares = valueText;
        });

        const username = $('#video-info h3').first().text().trim() || "Unknown";
        const duration = $('p.text-muted').first().text().replace(/Duration:/i, '').trim() || null;

        let mediaType = targetUrl.includes('/story/') ? "story" : "video";

        let mp3Url = null;
        let profilePictureUrl = null;
        let optionalThumbnailUrl = null;
        let fallbackDirectVideoUrl = null;
        let fallbackDirectWmVideoUrl = null;

        $('#formatselect option').each((_, el) => {
            const formatText = $(el).text().trim().toLowerCase();
            const rawValue = $(el).attr('value');
            if (!rawValue) return;

            try {
                const parsedJson = JSON.parse(rawValue);
                const firstUrl = parsedJson.URL && parsedJson.URL.length ? parsedJson.URL[0] : null;

                if (formatText === 'mp4') {
                    fallbackDirectVideoUrl = firstUrl;
                } else if (formatText.includes('watermark')) {
                    fallbackDirectWmVideoUrl = firstUrl;
                } else if (formatText.includes('mp3')) {
                    mp3Url = firstUrl;
                } else if (formatText.includes('profile picture')) {
                    profilePictureUrl = firstUrl;
                } else if (formatText.includes('thumbnail') || formatText.includes('cover')) {
                    optionalThumbnailUrl = firstUrl;
                }
            } catch (e) {}
        });

        const carouselItems = $('.carousel-item[data-data]');
        if (carouselItems.length > 0) {
            const slideUrls = [];
            carouselItems.each((_, el) => {
                try {
                    const rawJson = $(el).attr('data-data');
                    if (rawJson) {
                        const parsed = JSON.parse(rawJson);
                        if (parsed.URL && parsed.URL.length) slideUrls.push(parsed.URL[0]);
                    }
                } catch (e) {}
            });

            return {
                status: true,
                creator: "ONLym-Api",
                username: username,
                thumbnail: optionalThumbnailUrl || $('meta[property="og:image"]').attr('content') || "",
                profile_picture: profilePictureUrl,
                stats: { ...extractedStats, duration: duration || "0:00:00" },
                type: "slide",
                result: {
                    slides: slideUrls,
                    mp3: mp3Url
                }
            };
        }

        let optionEl = $('#formatselect option').first();
        if (!optionEl.length) {
            throw new Error("Gagal membedah manifes komponen video hulu. IP VPS lo diblokir WAF hulu.");
        }

        const dataInfo = optionEl.attr('value'); 
        
        let dataId = optionEl.attr('data-id') || optionEl.text().match(/id="([^"]+)"/)?.[1];
        if (!dataId && dataInfo) {
            const matchIdJson = dataInfo.match(/_(\d+)(?:_original)?\.mp4/);
            dataId = matchIdJson ? matchIdJson[1] : null;
        }
        if (!dataId) {
            const matchIdUrl = targetUrl.match(/\/(?:video|story)\/(\d+)/);
            dataId = matchIdUrl ? matchIdUrl[1] : Date.now().toString(); 
        }

        let downloadUrl = null;

        try {
            const triggerPayload = new URLSearchParams({
                id: dataId,
                url: targetUrl,
                csrf_token: innerCsrf || csrf,
                type: 'MP4',
                ext: 'mp4',
                info: dataInfo
            });

            const triggerRes = await axios.post('https://savett.cc/en1/trigger-download', triggerPayload.toString(), {
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://savett.cc',
                    'Referer': 'https://savett.cc/en1/download',
                    'Cookie': cookie
                }
            });

            const statusPath = triggerRes.data?.status_url;
            if (statusPath) {
                let attempts = 0;
                const maxAttempts = 15;

                while (attempts < maxAttempts) {
                    const taskCheck = await axios.get(`https://savett.cc${statusPath}?_=${Date.now()}`, {
                        headers: {
                            'Accept': 'application/json, text/javascript, */*; q=0.01',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': 'https://savett.cc/en1/download',
                            'Cookie': cookie
                        }
                    });

                    if (taskCheck.data?.url || taskCheck.data?.state === 'SUCCESS') {
                        downloadUrl = taskCheck.data.url || taskCheck.data.result;
                        break;
                    }
                    if (taskCheck.data?.state === 'FAILURE') {
                        break;
                    }

                    attempts++;
                    await new Promise(r => setTimeout(r, 1500)); 
                }
            }
        } catch (e) {
        }

        const finalNoWm = downloadUrl || fallbackDirectVideoUrl;
        const finalWm = downloadUrl ? downloadUrl.replace('-no-watermark', '-watermark') : (fallbackDirectWmVideoUrl || fallbackDirectVideoUrl);

        if (!finalNoWm) throw new Error("Gagal mengamankan link biner file dari server hulu.");

        return {
            status: true,
            creator: "ONLym-Api",
            username: username,
            thumbnail: optionalThumbnailUrl || $('.video-container img').attr('src') || "",
            profile_picture: profilePictureUrl,
            stats: { ...extractedStats, duration: duration },
            type: mediaType,
            result: {
                nowm: finalNoWm,
                wm: finalWm,
                mp3: mp3Url
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

module.exports = { expandUrl, getTokens, savett };
