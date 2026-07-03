/** CapCut Template Downloader
 * Base : https://www.capcut.com
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Menggunakan metode Deep-Recursive Search agar script tahan dari perubahan struktur JSON Capcut.
 **/

const axios = require('axios');

/**
 * Fungsi pembantu untuk mencari key secara rekursif di dalam objek bersarang (Deep Search)
 */
function findKeyDeep(obj, targetKey) {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.hasOwnProperty(targetKey)) return obj[targetKey];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const result = findKeyDeep(obj[key], targetKey);
            if (result) return result;
        }
    }
    return null;
}

async function CapcutDl(url) {
    try {
        const res = await axios.get(url, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8'
            }
        });
        
        const finalUrl = res.request.res.responseUrl || '';
        if (!/\/template-detail\/\d/.test(finalUrl) && !url.includes('template-detail')) {
            throw new Error("Tautan URL CapCut tidak valid atau bukan merupakan URL template.");
        }
        
        const script = res.data.match(/id="__MODERN_ROUTER_DATA__">(.*?)<\/script>/)?.[1];
        if (!script) throw new Error("Gagal mengekstrak manifest JSON state dari halaman web.");
        
        const parsedRouter = JSON.parse(script);
        
        // Melakukan pencarian mendalam (Deep Search) untuk mengekstrak 'templateDetail' di bagian objek mana pun
        const detail = findKeyDeep(parsedRouter, 'templateDetail');
        if (!detail) {
            throw new Error("Struktur komponen data template tidak ditemukan pada manifest hulu.");
        }
        
        return {
            status: true,
            creator: "ONLym-Api",
            result: {
                id: detail.templateId,
                title: detail.structuredData?.name || detail.title || "CapCut Template",
                region: detail.ugcLang || "N/A",
                duration: detail.templateDuration || 0,
                upload_date: detail.createTime || 0,
                statistic: {
                    play: detail.playAmount || 0,
                    usage: detail.usageAmount || 0,
                    like: detail.likeAmount || 0,
                    comment: detail.commentAmount || 0
                },
                author: {
                    name: detail.author?.name || "Unknown",
                    avatar: detail.author?.avatarUrl || "",
                    bio: detail.author?.description || ""
                },
                video_detail: {
                    ratio: detail.videoRatio || "N/A",
                    height: detail.videoHeight || 0,
                    width: detail.videoWidth || 0
                },
                cover_url: detail.coverUrl || "",
                download_url: detail.videoUrl || ""
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

module.exports = { findKeyDeep, CapcutDl };
