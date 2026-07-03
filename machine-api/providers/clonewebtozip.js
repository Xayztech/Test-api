const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SaveWeb2ZipAPI {
  constructor() {
    this.baseURL = 'https://copier.saveweb2zip.com';
    this.headers = {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/json',
      'origin': 'https://saveweb2zip.com',
      'referer': 'https://saveweb2zip.com/',
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
    };
  }

  async copySite(url) {
    const payload = {
      url: url,
      renameAssets: false,
      saveStructure: false,
      alternativeAlgorithm: false,
      mobileVersion: false
    };

    const response = await axios({
      method: 'POST',
      url: `${this.baseURL}/api/copySite`,
      headers: this.headers,
      data: payload
    });

    return response.data;
  }

  async getStatus(md5) {
    const response = await axios({
      method: 'GET',
      url: `${this.baseURL}/api/getStatus/${md5}`,
      headers: this.headers
    });

    return response.data;
  }

  async waitForCompletion(md5, interval = 2000, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getStatus(md5);
      
      if (status.isFinished) {
        return status;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Timeout');
  }

  async downloadArchive(md5, outputPath) {
    const response = await axios({
      method: 'GET',
      url: `${this.baseURL}/api/downloadArchive/${md5}`,
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'referer': 'https://saveweb2zip.com/',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
      },
      responseType: 'stream'
    });

    const filename = response.headers['content-disposition']
      .split('filename=')[1]
      .replace(/"/g, '');
    
    const fullPath = path.join(outputPath, filename);
    const writer = fs.createWriteStream(fullPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(fullPath));
      writer.on('error', reject);
    });
  }

  async copyAndDownload(url, outputDir = './downloads') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const start = await this.copySite(url);
    
    if (start.md5) {
      const status = await this.waitForCompletion(start.md5);
      
      if (status.success) {
        const filePath = await this.downloadArchive(start.md5, outputDir);
        return {
          success: true,
          file: filePath,
          filesCount: status.copiedFilesAmount,
          url: status.url
        };
      }
    }
    
    return start;
  }
}

module.exports = { SaveWeb2ZipAPI };
