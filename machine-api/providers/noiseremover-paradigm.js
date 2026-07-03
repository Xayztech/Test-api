const fs = require('node:fs');
const path = require('node:path');

async function uploadToTmpFiles(buffer, fileName) {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), fileName);

    try {
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' && data.data && data.data.url) {
            let originalUrl = data.data.url;
            let parts = originalUrl.split('/');
            let fileId = parts[parts.length - 2];
            let name = parts[parts.length - 1];
            return `https://tmpfiles.org/dl/${fileId}/${name}`;
        } else {
            throw new Error('Upload failed - no URL returned');
        }
    } catch (err) {
        throw new Error('Upload failed: ' + err.message);
    }
}

async function NoiseRemover(filePath) {
    try {
        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer]);
        
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const response = await fetch('https://ai-services.visual-paradigm.com/api/denoise/file', {
            method: 'POST',
            headers: {
                'Origin': 'https://online.visual-paradigm.com',
                'Referer': 'https://online.visual-paradigm.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const outputBuffer = Buffer.from(arrayBuffer);
        const outputName = `denoised_${fileName}`;

        const url = await uploadToTmpFiles(outputBuffer, outputName);
        console.log(url);
        return url;

    } catch (error) {
        console.error(error);
    }
}

module.exports = { uploadToTmpFiles, NoiseRemover };
