const axios = require("axios");

async function removeBgOnlym(imageUrl, apikey) {
  const key = apikey || process.env.ONLYM_APIKEY;
  if (!key) throw new Error("ONLYM_APIKEY belum diset di .env");
  if (!imageUrl) throw new Error("imageUrl wajib diisi");

  try {
    const res = await axios.get(
      `https://onlym.my.id/tools/removebg?url=${encodeURIComponent(imageUrl)}&apikey=${key}`,
      { responseType: "arraybuffer", timeout: 172800000 }
    );
    return { status: true, engine: "removebg-v1", buffer: Buffer.from(res.data) };
  } catch (e) {
    const { data } = await axios.get(
      `https://onlym.my.id/tools/removebgv2?url=${encodeURIComponent(imageUrl)}&apikey=${key}`,
      { timeout: 172800000 }
    );
    if (!data || !data.status || !data.result || !data.result.output) throw new Error("Fallback removebgv2 gagal");
    const fallback = await axios.get(data.result.output, { responseType: "arraybuffer", timeout: 172800000 });
    return { status: true, engine: "removebg-v2-fallback", buffer: Buffer.from(fallback.data) };
  }
}

module.exports = { removeBgOnlym };
