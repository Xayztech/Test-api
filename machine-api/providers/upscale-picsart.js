/* Upscale Image PicsArt
* Base : https://picsart[dot]com/ai-image-enhancer/
* Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
* Author : ONLym-Api
* Note : Scale 2/4, face_enhancement (true/false) face_blending_cbcr 0.1 - 1.0
         Hasil terbaik > Scale 2, false, 0.5
*/

const fs = require('fs');

class PicsartEnhancer {
    constructor() {
        this.uploadUrl = 'https://upload.picsart.com/files';
        this.aiUrl = 'https://ai.picsart.com';
        this.jsUrl = 'https://picsart.com/-/landings/4.310.0/static/index-C3-HwnoW-GZgP7cLS.js';
        this.token = null;
        this.headers = {
            'origin': 'https://picsart.com',
            'referer': 'https://picsart.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'accept': '*/*'
        };
    }

    async getToken() {
        const resp = await fetch(this.jsUrl, { headers: this.headers });
        const text = await resp.text();
        const match = text.match(/"x-app-authorization":"Bearer\s+([^"]+)"/);
        if (match?.[1]) {
            this.token = match[1];
            return this.token;
        }
        throw new Error('Token not found');
    }

    async upload(buffer) {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);

        let body = `--${boundary}\r\n`;
        body += 'Content-Disposition: form-data; name="type"\r\n\r\n';
        body += 'editing-temp-landings\r\n';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n`;
        body += `Content-Type: image/jpeg\r\n\r\n`;

        const part1 = Buffer.from(body, 'utf-8');
        const part2 = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="url"\r\n\r\n\r\n--${boundary}\r\nContent-Disposition: form-data; name="metainfo"\r\n\r\n\r\n--${boundary}--\r\n`, 'utf-8');
        const data = Buffer.concat([part1, buffer, part2]);

        const resp = await fetch(this.uploadUrl, {
            method: 'POST',
            headers: {
                ...this.headers,
                'content-type': `multipart/form-data; boundary=${boundary}`,
                'accept': 'application/json'
            },
            body: data
        });
        return await resp.json();
    }

    async enhance(url, scale, faceEnhance, faceBlend) {
        if (!this.token) await this.getToken();
        
        const params = new URLSearchParams({
            picsart_cdn_url: url,
            format: 'PNG',
            model: 'REALESERGAN'
        });

        const body = JSON.stringify({
            image_url: url,
            colour_correction: { enabled: false, blending: 0.5 },
            seed: 42,
            upscale: { enabled: true, node: 'esrgan', target_scale: scale },
            face_enhancement: { enabled: faceEnhance, face_blending_cbcr: faceBlend }
        });

        const resp = await fetch(`${this.aiUrl}/gw1/diffbir-enhancement-service/v1.7.6?${params}`, {
            method: 'POST',
            headers: {
                ...this.headers,
                'accept': 'application/json',
                'content-type': 'application/json',
                'platform': 'website',
                'x-app-authorization': `Bearer ${this.token}`,
                'x-touchpoint': 'widget_EnhancedImage',
                'x-touchpoint-referrer': '/ai-image-enhancer/',
                'task-mode': 'async'
            },
            body
        });
        return await resp.json();
    }

    async checkStatus(id) {
        if (!this.token) await this.getToken();

        const resp = await fetch(`${this.aiUrl}/gw1/diffbir-enhancement-service/v1.7.6/${id}`, {
            method: 'GET',
            headers: {
                ...this.headers,
                'accept': 'application/json',
                'x-app-authorization': `Bearer ${this.token}`,
                'platform': 'website'
            }
        });
        return await resp.json();
    }

    async run(imgPath, scale = 2, faceEnhance = true, faceBlend = 0.5) {
        if (!fs.existsSync(imgPath)) throw new Error(`File ${imgPath} tidak ditemukan.`);
        const buffer = fs.readFileSync(imgPath);

        const upload = await this.upload(buffer);
        if (upload.status !== 'success') throw new Error('Upload failed');

        let responseData = await this.enhance(upload.result.url, scale, faceEnhance, faceBlend);
        if (!responseData || (responseData.status !== 'ACCEPTED' && responseData.status !== 'DONE')) {
            throw new Error('Gagal membuat antrean pemrosesan gambar.');
        }

        const taskId = responseData.id;
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            const checkData = await this.checkStatus(taskId);

            if (checkData.status === 'DONE' && checkData.result?.image_url) {
                const imageFetch = await fetch(checkData.result.image_url);
                if (!imageFetch.ok) throw new Error(`Gagal mengunduh gambar jadi dari CDN: ${imageFetch.status}`);
                return Buffer.from(await imageFetch.arrayBuffer());
            } else if (checkData.status === 'FAILED' || checkData.error_message) {
                throw new Error(`AI Picsart gagal memproses: ${checkData.error_message}`);
            }
        }
        throw new Error('Timeout: Batas waktu tunggu antrean server habis.');
    }
}

module.exports = { PicsartEnhancer };
