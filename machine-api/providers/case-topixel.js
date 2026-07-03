const axios = require("axios");

async function toPixel(imageUrl, level, apikey) {
  const key = apikey || process.env.ONLYM_APIKEY;
  if (!key) throw new Error("ONLYM_APIKEY belum diset di .env");
  if (!imageUrl) throw new Error("imageUrl wajib diisi");

  let lvl = parseInt(level, 10);
  if (isNaN(lvl)) lvl = 30;
  if (lvl > 40) lvl = 40;
  if (lvl < 1) lvl = 1;

  const endpoint = `https://onlym.my.id/ai-image/topixel?url=${encodeURIComponent(imageUrl)}&level=${lvl}&apikey=${encodeURIComponent(key)}`;
  const { data } = await axios.get(endpoint, {
    timeout: 172800000,
    headers: { "user-agent": "Mozilla/5.0" }
  });

  if (!data || !data.status || !data.result || !data.result.url) throw new Error((data && data.message) || "Gagal memproses gambar pixel");

  return { status: true, level: lvl, result: data.result };
}

module.exports = { toPixel };
