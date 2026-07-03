const image_url = "https://api.nexadev.my.id/uploder/uploads/VlQSjf.jpg";

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const AUTHOR = "NexaDev";

function jsonOut(status, data = {}) {
  process.stdout.write(JSON.stringify({ author: AUTHOR, status, ...data }, null, 2) + '\n');
}

function jsonErr(message, code = 1) {
  process.stderr.write(JSON.stringify({ author: AUTHOR, status: "error", message }, null, 2) + '\n');
  process.exit(code);
}

function randomName(len = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function fetchImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(imageUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.get(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        'Accept': 'image/*,*/*',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const contentType = res.headers['content-type'] || 'image/jpeg';
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(`data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function removeBackground(encodedImage, title = 'image.jpg') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ encodedImage, title, mimeType: 'image/jpeg' });
    const options = {
      hostname: 'background-remover.com',
      path: '/removeImageBackground',
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent':     'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        'Referer':        'https://background-remover.com/upload',
        'Accept':         '*/*',
        'Origin':         'https://background-remover.com',
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        if (res.statusCode !== 200) return reject(new Error(`API ${res.statusCode}`));
        const ct = res.headers['content-type'] || '';
        if (ct.includes('image/')) { resolve({ _rawBuffer: raw }); return; }
        try { resolve(JSON.parse(raw.toString())); }
        catch { resolve({ result: raw.toString() }); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function saveBase64Image(data, outputPath) {
  const b64 = data.replace(/^data:[^;]+;base64,/, '').trim();
  fs.writeFileSync(outputPath, Buffer.from(b64, 'base64'));
}

function uploadToCloud(filePath) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const header = Buffer.from([
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="files[]"; filename="${filename}"\r\n`,
      `Content-Type: ${mimeType}\r\n`,
      `\r\n`,
    ].join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const options = {
      hostname: 'clooud.my.id',
      path: '/uploder/',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'User-Agent': 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        'Accept': '*/*',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Upload parse error')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function saveUrlToScript(newUrl) {
  const scriptPath = __filename;
  let content = fs.readFileSync(scriptPath, 'utf8');
  content = content.replace(
    /^const image_url = ".*";$/m,
    `const image_url = "${newUrl}";`
  );
  fs.writeFileSync(scriptPath, content, 'utf8');
}

async function main() {
  if (!image_url) {
    jsonErr('image_url kosong, isi dulu di dalam script.');
  }

  const outputFile = randomName(5) + '.png';
  const title = path.basename(new URL(image_url).pathname || 'image.jpg');

  try {
    const encodedImage = await fetchImageAsBase64(image_url);
    const response = await removeBackground(encodedImage, title);

    if (response._rawBuffer) {
      fs.writeFileSync(outputFile, response._rawBuffer);
    } else {
      const resultData =
        response.encodedImageWithoutBackground ||
        response.image || response.resultImage ||
        response.output || response.data || response.result || null;

      if (!resultData) throw new Error('No image data in response');

      if (typeof resultData === 'string' && resultData.startsWith('http')) {
        saveBase64Image(await fetchImageAsBase64(resultData), outputFile);
      } else if (typeof resultData === 'string') {
        saveBase64Image(resultData, outputFile);
      } else {
        throw new Error('Unknown result format');
      }
    }

    const uploadResult = await uploadToCloud(outputFile);

    try { fs.unlinkSync(outputFile); } catch {}

    const imageUrl =
      uploadResult?.files?.[0]?.url ||
      uploadResult?.url             ||
      uploadResult?.data?.url       ||
      null;

    if (imageUrl) {
      saveUrlToScript(imageUrl);
      jsonOut("success", {
        message: "Background removed and uploaded successfully.",
        result_url: imageUrl
      });
    } else {
      jsonErr('Could not extract image_url from upload response');
    }

  } catch (err) {
    jsonErr(err.message);
  }
}

module.exports = { jsonOut, jsonErr, randomName, fetchImageAsBase64, removeBackground, saveBase64Image, uploadToCloud, saveUrlToScript, main };
