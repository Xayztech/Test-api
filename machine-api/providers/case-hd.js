const axios = require("axios");

async function hdUpscale(imageUrl, apikey) {
  const key = apikey || process.env.ONLYM_APIKEY;
  if (!key) throw new Error("ONLYM_APIKEY belum diset di .env");
  if (!imageUrl) throw new Error("imageUrl wajib diisi");

  const apiUrl = `https://onlym.my.id/tools/beautyplus?url=${encodeURIComponent(imageUrl)}&apikey=${encodeURIComponent(key)}`;
  const res = await axios.get(apiUrl, { timeout: 172800000, validateStatus: () => true });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

  const data = res.data;
  if (!data || !data.status || !data.result) throw new Error((data && data.message) || "Response API tidak valid");

  return { status: true, creator: data.creator || "onlym.my.id", result: data.result };
}

module.exports = { hdUpscale };
