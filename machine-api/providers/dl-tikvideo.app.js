const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function tiktokTikVideo(url) {
    if (!url) throw new Error('url tiktok wajib diisi');

    const payload = qs.stringify({
        q: url,
        lang: 'en',
        cftoken: ''
    });

    try {
        const res = await axios.post(
            'https://tikvideo.app/api/ajaxSearch',
            payload,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent':
                        'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36'
                }
            }
        );

        if (res.data.status !== 'ok') {
            throw new Error('gagal convert video');
        }

        const html = res.data.data;
        const $ = cheerio.load(html);

        const title = $('h3').first().text().trim();
        const thumbnail = $('.thumbnail img').attr('src');

        const videoUrl = $('#ConvertToVideo').attr('data-audioUrl');
        const mp3Url = $('.tik-button-dl:contains("MP3")').attr('href');

        const images = [];
        $('.photo-list img').each((_, el) => {
            images.push($(el).attr('src'));
        });

        return {
            title,
            thumbnail,
            video: videoUrl || null,
            mp3: mp3Url || null,
            images
        };
    } catch (err) {
        throw new Error('scraper error');
    }
}

module.exports = { tiktokTikVideo };
