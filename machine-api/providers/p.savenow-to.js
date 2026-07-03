const axios = require('axios');

const availableType = ["mp3", "m4a", "webm", "aac", "flac", "opus", "ogg", "wav", "1440", "1080", "720", "480", "360"];

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchData(url, max) {
  let tries = 0;
  while (tries < max) {
    tries++;
    const { data } = await axios.get(url);

    if (data?.success) {
      return data;
    }

    await delay(5000);
  }
  throw new Error("Timeout: konversi tidak selesai");
}

async function downloadYT(url, type = "480") {
  try {
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      throw new Error("URL tidak valid. Masukkan link YouTube.");
    }

    if (!availableType.includes(type)) {
      throw new Error("Invalid type! Available type: " + availableType.join(", "));
    }

    const { data } = await axios.get(
      `https://p.savenow.to/ajax/download.php?copyright=0&format=${type}&url=${encodeURIComponent(
        url.trim()
      )}`
    );

    if (!data.success) {
      throw new Error("Gagal memulai download");
    }

    const id = data.id;

    const result = await fetchData(
      `https://p.savenow.to/api/progress?id=${id}`,
      12
    );

    return {
      status: true,
      type: type,
      data: {
        title: data.title || data.info?.title || result.title || null,
        cover: data.info?.image || data.thumbnail_url || result.thumbnail_url || null,
        download: {
          main: result.download_url || null,
          alt1: result.alternative_download_urls?.[0]?.url || null,
          alt2: result.alternative_download_urls?.[1]?.url || null,
          alt3: result.alternative_download_urls?.[2]?.url || null
        }
      }
    };
  } catch (error) {
    return { status: false, msg: error.message || error };
  }
}

module.exports = { delay, fetchData, downloadYT };
