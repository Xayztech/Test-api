/** Spotify Downloader Track & Playlist
 * Base : https://spotitrack[dot]com
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Mendukung unduhan Track atau Playlist via Event-Stream (SSE).
 **/

const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));
async function getLatestNextAction(host) {
    const htmlRes = await fetch(`https://${host}/`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
        }
    });
    if (!htmlRes.ok) throw new Error("Gagal memuat halaman utama untuk sinkronisasi token.");
    const html = await htmlRes.text();
    
    const actionRegex = /"action"\s*:\s*"([a-f0-9]{40})"/i;
    const match = html.match(actionRegex);
    return match ? match[1] : '40140d41ab0803c936eac316edb1fbc6b036e5478f';
}

module.exports = { getLatestNextAction };
