/** Scrape Downloader Youtube mp3/mp4
* Base : https://v3[dot]y2mate[dot]nu/
* Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
* Author : ONLym-Api
* Note : ytmp3, ytmp4 simple output
**/

const axios = require('axios');

const gB = Buffer.from('ZXRhY2xvdWQub3Jn', 'base64').toString();

const headers = {
  origin: 'https://v3.y2mate.nu',
  referer: 'https://v3.y2mate.nu/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  accept: '*/*'
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function ts() {
  return Math.floor(Date.now() / 1000);
}

function extrakid(url) {
  const m =
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /v=([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/shorts\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/live\/([a-zA-Z0-9_-]{11})/.exec(url);

  if (!m) throw new Error('invalid youtube url');
  return m[1];
}

async function getAuthKey() {
  const url = `https://eta.${gB}/api/v1/auth?_=${Date.now()}`;
  const res = await axios.get(url, { headers });
  if (res.data?.err !== 0 || !res.data?.key) {
    throw new Error('Gagal mendapatkan token autentikasi dari server hulu.');
  }
  return res.data.key;
}

async function init(authKey) {
  const url = `https://eta.${gB}/api/v1/init?_=${Date.now()}`;
  const res = await axios.get(url, {
    headers: {
      ...headers,
      'Authorization': `Bearer ${authKey}`
    }
  });
  if (res.data.error && res.data.error !== '0' && res.data.error !== 0) {
    throw res.data;
  }
  return res.data;
}

async function yt2mate(videoUrl, format = 'mp3') {
  try {
    const videoId = extrakid(videoUrl);

    const authKey = await getAuthKey();

    const initRes = await init(authKey);

    let res = await axios.get(
      initRes.convertURL +
        '&v=' + videoId +
        '&f=' + format +
        '&t=' + ts() +
        '&_=' + Date.now(),
      { headers }
    );

    let data = res.data;

    if (data.error && data.error !== 0) {
      throw data;
    }

    if (data.redirect === 1 && data.redirectURL) {
      const r2 = await axios.get(
        data.redirectURL + '&t=' + ts(),
        { headers }
      );
      data = r2.data;
    }

    if (data.downloadURL && !data.progressURL) {
      return {
        status: true,
        id: videoId,
        title: data.title,
        format,
        download: data.downloadURL.replace(/\\/g, '')
      };
    }

    let progressUrl = data.progressURL;
    let downloadUrl = data.downloadURL;
    let title = data.title;

    for (;;) {
      await sleep(3000);

      const progressRes = await axios.get(
        progressUrl + '&t=' + ts(),
        { headers }
      );

      const p = progressRes.data;

      if (p.error && p.error !== 0) {
        throw p;
      }

      if (p.title) title = p.title;
      if (p.downloadURL) downloadUrl = p.downloadURL;

      if (p.progress === 3 || p.status === 'completed' || downloadUrl) {
        return {
          status: true,
          id: videoId,
          title: title,
          format,
          download: downloadUrl.replace(/\\/g, '')
        };
      }
    }
  } catch (error) {
    return { status: false, msg: error.message || error };
  }
}

module.exports = { sleep, ts, extrakid, getAuthKey, init, yt2mate };
