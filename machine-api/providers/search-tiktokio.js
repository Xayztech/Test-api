/*
NAME: tiktokio.com — Downloader
Type: Scraper
Noted: Jangan lupa follow. Atur saja sendiri mas, anu... jangan lupa follow
Saluran: https://whatsapp.com/channel/0029Vb6dJVWBA1eukbJ5kX1r
Base Url: https://tiktokio.com
Developer: t.me/hazeloffc
*/
const axios = require('axios');
const cheerio = require('cheerio');

async function getTikTokDownloadInfo(url) {
    const response = await axios.post('https://tiktokio.com/api/v1/tk/html', {
        vid: url,
        prefix: 'tiktokio.com'
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
}

async function extractDownloadLinks(html) {
    const $ = cheerio.load(html);
    const downloadLinks = [];
    
    $('.download-btn').each((index, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && !href.includes('javascript:')) {
            downloadLinks.push({
                text: text,
                url: href
            });
        }
    });
    
    const coverImage = $('.video-info img').attr('src');
    const description = $('.video-info h3').text().trim();
    
    return {
        coverImage: coverImage,
        description: description,
        downloadLinks: downloadLinks
    };
}

async function downloadTikTok(url) {
    const html = await getTikTokDownloadInfo(url);
    const result = await extractDownloadLinks(html);
    
    return result;
}

module.exports = { getTikTokDownloadInfo, extractDownloadLinks, downloadTikTok };
