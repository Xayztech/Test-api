const axios = require('axios');
const fs = require('fs');

/**
 * Konfigurasi Header Global
 * @type {Object}
 */
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.tiktok.com/',
};

/**
 * Mencari nilai berdasarkan kunci (key) secara rekursif dalam objek JSON.
 * 
 * @param {Object|Array} obj - Objek atau array yang akan dicari.
 * @param {string} key - Kunci yang ingin ditemukan nilainya.
 * @returns {*} Nilai dari kunci yang ditemukan, atau null jika tidak ditemukan.
 */
function findKey(obj, key) {
    let seen = new Set();
    function search(o) {
        if (typeof o !== 'object' || o === null || seen.has(o)) return null;
        seen.add(o);
        if (o[key]) return o[key];
        for (let k in o) {
            let res = search(o[k]);
            if (res) return res;
        }
        return null;
    }
    return search(obj);
}

/**
 * Memformat cookie dari array set-cookie menjadi string tunggal.
 * 
 * @param {string[]} setCookieHeader - Header set-cookie dari axios.
 * @returns {string} String cookie yang diformat.
 */
function formatCookies(setCookieHeader) {
    if (!setCookieHeader || !Array.isArray(setCookieHeader)) return "";
    return setCookieHeader.map(c => c.split(';')[0]).join('; ');
}

/**
 * Menggabungkan URL dengan cookie sebagai fragmen #cookie=...
 * 
 * @param {string} url - URL asli.
 * @param {string} cookieString - String cookie.
 * @returns {string} URL yang sudah digabung dengan cookie.
 */
function wrapWithCookie(url, cookieString) {
    if (!url || !cookieString) return url;
    return `${url}#cookie=${encodeURIComponent(cookieString)}`;
}

/**
 * Mengambil data lengkap TikTok (Metadata + Link Video Tanpa Watermark).
 * Semua link yang dihasilkan akan otomatis menyertakan cookie.
 * 
 * @param {string} url - URL TikTok Video atau Story.
 * @returns {Promise<Object>} Objek berisi status dan data lengkap dengan link ber-cookie.
 */
async function getTikTokData(url) {
    try {
        // 1. Ambil Metadata dasar dan Cookie dari TikTok
        const response = await axios.get(url, { headers: HEADERS });
        const html = response.data;
        const cookieString = formatCookies(response.headers['set-cookie']);
        
        const regex = /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/;
        const match = html.match(regex);

        let metadata = {};
        if (match) {
            const jsonData = JSON.parse(match[1]);
            const item = findKey(jsonData, 'itemStruct');
            if (item) {
                metadata = {
                    id: item.id,
                    description: item.desc || "",
                    create_time: new Date(parseInt(item.createTime) * 1000).toLocaleString('id-ID'),
                    author: {
                        username: item.author?.uniqueId,
                        nickname: item.author?.nickname,
                        avatar: item.author?.avatarThumb,
                    },
                    statistics: {
                        likes: item.stats?.diggCount || 0,
                        views: item.stats?.playCount || 0
                    }
                };
            }
        }

        // 2. Ambil Link Video Asli dari TikWM API
        const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const apiData = tikwmRes.data;

        if (apiData.code !== 0) {
            throw new Error(apiData.msg || 'Gagal mendapatkan data dari TikWM API.');
        }

        const videoInfo = apiData.data;

        // 3. Susun Output dengan semua link terbungkus cookie
        return {
            status: true,
            video_data: {
                id: videoInfo.id || metadata.id,
                title: videoInfo.title || metadata.description,
                create_time: metadata.create_time,
                duration: videoInfo.duration,
                download_urls: {
                    // Semua link video/audio menyertakan cookie
                    no_watermark: wrapWithCookie(videoInfo.play, cookieString),
                    watermark: wrapWithCookie(videoInfo.wmplay, cookieString),
                    hd: wrapWithCookie(videoInfo.hdplay, cookieString),
                    music: wrapWithCookie(videoInfo.music, cookieString)
                },
                covers: {
                    default: wrapWithCookie(videoInfo.cover, cookieString),
                    origin: wrapWithCookie(videoInfo.origin_cover, cookieString)
                }
            },
            author_data: {
                username: videoInfo.author?.unique_id || metadata.author?.username,
                nickname: videoInfo.author?.nickname || metadata.author?.nickname,
                avatar: wrapWithCookie(videoInfo.author?.avatar || metadata.author?.avatar, cookieString)
            },
            statistics: {
                likes: videoInfo.digg_count || metadata.statistics?.likes,
                views: videoInfo.play_count || metadata.statistics?.views,
                comments: videoInfo.comment_count,
                shares: videoInfo.share_count
            },
            request_info: {
                cookies: cookieString,
                fetch_time: new Date().toISOString()
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}

/**
 * Mengunduh file video TikTok ke sistem file lokal.
 * 
 * @param {string} url - URL download video (bisa mengandung #cookie=...).
 * @param {string} outputPath - Path tujuan penyimpanan file.
 * @param {string} [manualCookie=""] - String cookie jika link tidak mengandung fragmen cookie.
 * @returns {Promise<string>} Path file yang berhasil diunduh.
 */
async function downloadTikTok(url, outputPath, manualCookie = "") {
    try {
        let finalUrl = url;
        let cookieToUse = manualCookie;

        // Jika URL mengandung fragmen cookie, ekstrak dan bersihkan URL
        if (url.includes('#cookie=')) {
            const parts = url.split('#cookie=');
            finalUrl = parts[0];
            cookieToUse = decodeURIComponent(parts[1]);
        }

        const headers = { ...HEADERS };
        if (cookieToUse) headers['Cookie'] = cookieToUse;

        const response = await axios({
            method: 'get',
            url: finalUrl,
            responseType: 'stream',
            headers: headers
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(outputPath));
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Download Gagal: ${error.message}`);
    }
}

// --- CLI HANDLER ---
if (require.main === module) {
    const args = process.argv.slice(2);
    const targetUrl = args[0] || "https://www.tiktok.com/@senseirumus/video/7655692321551289621";

    console.log(`\n[TikTok Downloader] Memproses semua link dengan Cookie: ${targetUrl}...\n`);

    getTikTokData(targetUrl).then(async (res) => {
        if (!res.status) {
            console.error(`[Error] ${res.message}`);
            return;
        }

        console.log("=== SEMUA LINK + COOKIE ===");
        console.log(JSON.stringify(res, null, 2));

        const dlLink = res.video_data.download_urls.no_watermark;
        const filename = `tiktok_final_${res.video_data.id}.mp4`;

        console.log(`\n[Download] Mengunduh menggunakan link ber-cookie ke: ${filename}`);
        try {
            await downloadTikTok(dlLink, filename);
            console.log(`[Berhasil] Video disimpan sebagai: ${filename}\n`);
        } catch (err) {
            console.error(`[Gagal] ${err.message}`);
        }
    });
}

module.exports = { getTikTokData, downloadTikTok };