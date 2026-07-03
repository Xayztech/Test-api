/** Removal Remove Background
 * Base : https://removal[dot]ai
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : yagitu
**/

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://removal.ai',
    'Referer': 'https://removal.ai/upload/',
    'X-Requested-With': 'XMLHttpRequest'
};

function cleanCookies(cookieHeaders) {
    if (!cookieHeaders || !cookieHeaders.length) return '';
    return cookieHeaders
        .map(c => v = c.split(';')[0])
        .filter(c => c.trim().length > 0)
        .join('; ');
}

async function getwebtoken() {
    const session = await axios.get('https://removal.ai/upload/', { headers: baseHeaders });
    const rawCookies = session.headers['set-cookie'];
    const cookies = cleanCookies(rawCookies);

    const nonceMatch = session.data.match(/"ajax_nonce"\s*:\s*"([^"]+)"/) || session.data.match(/security\s*=\s*"([^"]+)"/);
    const securityNonce = nonceMatch ? nonceMatch[1] : "f84d58eda0";

    const r = await axios.get('https://removal.ai/wp-admin/admin-ajax.php', {
        headers: {
            ...baseHeaders,
            'Cookie': cookies
        },
        params: {
            action: 'ajax_get_webtoken',
            security: securityNonce
        }
    });

    if (!r.data || !r.data.success || !r.data.data?.webtoken) {
        throw new Error("Gagal mengamankan valid Web-Token dari server : " + JSON.stringify(r.data));
    }

    return {
        token: r.data.data.webtoken,
        cookies: cookies
    };
}

async function removebg(img) {
    try {
        const pathImg = path.resolve(img);
        if (!fs.existsSync(pathImg)) throw new Error(`File lokal [${img}] tidak ditemukan.`);

        const { token, cookies } = await getwebtoken();

        const form = new FormData();
        form.append('image_file', fs.createReadStream(pathImg), {
            filename: path.basename(pathImg),
            contentType: 'image/jpeg'
        });

        const r = await axios.post('https://api.removal.ai/3.0/remove', form, {
            headers: {
                ...baseHeaders,
                ...form.getHeaders(),
                'Web-Token': token,
                'Cookie': cookies
            },
        });

        const resData = r.data;

        return {
            status: true,
            creator: "ONLym-Api",
            data: {
                width: resData.original_width || null,
                height: resData.original_height || null,
                original_url: resData.original || null,
                result_url: resData.url || resData.low_resolution || null
            }
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.response ? `Request failed [${error.response.status}] - ${JSON.stringify(error.response.data)}` : error.message
        };
    }
}

module.exports = { cleanCookies, getwebtoken, removebg };
