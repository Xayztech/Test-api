/** Pinterest Video/Image Downloader
 * Base : https://pindown[dot]io
 * Author : ONLym-Api
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Note : Otomatis get link unduhan dari data HTML memakai selektor DOM Cheerio
 **/

const axios = require('axios');
const cheerio = require('cheerio');

class PinDownAPI {
    constructor() {
        this.baseURL = "https://pindown.io";
    }

    async getDynamicToken() {
        const response = await axios.get(`${this.baseURL}/en1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        let tokenName = '';
        let tokenValue = '';
        
        $('form input').each((i, el) => {
            const name = $(el).attr('name');
            if (name && name !== 'url' && name !== 'lang') {
                tokenName = name;
                tokenValue = $(el).attr('value') || '';
            }
        });

        const rawCookies = response.headers['set-cookie'] || [];
        const cookieString = rawCookies.map(c => c.split(';')[0]).join('; ');

        return { tokenName, tokenValue, cookieString };
    }

    async download(url, lang = "en") {
        const { tokenName, tokenValue, cookieString } = await this.getDynamicToken();
        if (!tokenName) throw new Error("Gagal mengekstrak Anti-Bot Key dinamis dari halaman utama.");

        const formData = new URLSearchParams();
        formData.append("url", url);
        formData.append(tokenName, tokenValue);
        formData.append("lang", lang);

        const response = await axios({
            method: "POST",
            url: `${this.baseURL}/action`,
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "cookie": cookieString,
                "origin": this.baseURL,
                "referer": `${this.baseURL}/en1`,
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: formData.toString(),
        });

        return response.data;
    }

    parseDownloadLinks(html) {
        const $ = cheerio.load(html);
        const links = [];

        $('table tbody tr').each((i, el) => {
            const quality = $(el).find('td.video-quality').text().trim();
            const downloadUrl = $(el).find('a').attr('href');

            if (downloadUrl && quality) {
                links.push({
                    quality: quality,
                    url: downloadUrl
                });
            }
        });

        return links;
    }

    async getDownloadLinks(url, lang = "en") {
        try {
            const result = await this.download(url, lang);

            if (result.success && result.html) {
                const links = this.parseDownloadLinks(result.html);
                return {
                    status: true,
                    creator: "ONLym-Api",
                    result: links
                };
            }

            return {
                status: false,
                creator: "ONLym-Api",
                message: result.message
            };
        } catch (error) {
            return {
                status: false,
                creator: "ONLym-Api",
                message: error.message
            };
        }
    }
}

// --- Testing Run :

module.exports = { PinDownAPI };
