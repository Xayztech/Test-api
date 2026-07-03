import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import FormData from 'form-data';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
const BASE_URL = 'https://api.deepai.org';

function getMD5Reversed(input) {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return hash.split("").reverse().join("");
}

function generateApiKey() {
    const randomStr = Math.round((Math.random() * 100000000000)) + "";
    const salt = 'hackers_become_a_little_stinkier_every_time_they_hack';
    
    const h1 = getMD5Reversed(UA + randomStr + salt);
    const h2 = getMD5Reversed(UA + h1);
    const h3 = getMD5Reversed(UA + h2);
    
    return `tryit-${randomStr}-${h3}`;
}

async function Colorizer(filePath) {
    try {
        const apiKey = generateApiKey();
        
        const formUpload = new FormData();
        formUpload.append('file', fs.createReadStream(filePath));

        const uploadRes = await axios.post(`${BASE_URL}/upload-temp-blob`, formUpload, {
            headers: {
                ...formUpload.getHeaders(),
                'User-Agent': UA,
                'Referer': 'https://deepai.org/',
                'Origin': 'https://deepai.org'
            }
        });

        const blobRef = uploadRes.data.blob_ref;
        if (!blobRef) throw new Error('Gagal mendapatkan blob_ref');

        const formProcess = new FormData();
        formProcess.append('image', blobRef);
        formProcess.append('image_generator_version', 'standard');

        const processRes = await axios.post(`${BASE_URL}/api/colorizer`, formProcess, {
            headers: {
                ...formProcess.getHeaders(),
                'api-key': apiKey,
                'User-Agent': UA,
                'Referer': 'https://deepai.org/',
                'Origin': 'https://deepai.org'
            }
        });

        return processRes.data;

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = { getMD5Reversed, generateApiKey, Colorizer };
