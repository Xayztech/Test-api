/** Search Lyrics Genius

* Base : https://genius[dot]com
* Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
* Author : ONLym-Api
* Note : Kalo tiba-tiba 403, coba pakein proxy
**/

const cheerio = require('cheerio');
const axios = require('axios');

const geniusLyrics = async (q) => {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://genius.com/',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const searchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(q)}`;
        const { data: searchResponse } = await axios.get(searchUrl, { headers });
        
        const sections = searchResponse.response.sections;
        const songSection = sections.find(s => s.type === 'song');
        
        if (!songSection || songSection.hits.length === 0) {
            throw Error("Lirik tidak ditemukan.");
        }

        const songData = songSection.hits[0].result;
        const songUrl = songData.url;

        const { data: lyricsHtml } = await axios.get(songUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(lyricsHtml);
        
        $('script, style, ins, .Lyrics__Footer, .RightSidebar__Container, [class^="LyricsHeader__"]').remove();

        let lyrics = "";
        const containers = $('div[data-lyrics-container="true"]');
        
        if (containers.length > 0) {
            containers.each((i, el) => {
                $(el).find('br').each((i, br) => $(br).replaceWith('\n'));
                lyrics += $(el).text() + '\n';
            });
        } else {
            lyrics = $('.lyrics').text() || $('meta[property="og:description"]').attr('content') || "";
        }

        // Membersihkan duplikasi teks judul lagu otomatis bawaan kontainer pertama
        const songTitleClean = `${songData.title} Lyrics`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let finalLyrics = lyrics.trim();
        
        const firstLine = finalLyrics.split('\n')[0] || '';
        const firstLineClean = firstLine.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        if (firstLineClean.includes(songTitleClean) || firstLineClean.includes('lyrics')) {
            finalLyrics = finalLyrics.substring(firstLine.length).trim();
        }

        // Formatting kerapian penjarakan tag header bait lirik
        finalLyrics = finalLyrics
            .replace(/\[.*?\]/g, (match) => `\n${match}\n`)
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return {
            status: true,
            creator: "ONLym",
            result: {
                title: songData.full_title,
                image: songData.song_art_image_url,
                url: songUrl,
                lyrics: finalLyrics
            }
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.response?.status === 403 ? "Terdeteksi Bot (403 Forbidden). Coba ganti IP atau gunakan Proxy." : error.message
        };
    }
};

module.exports = { geniusLyrics };
