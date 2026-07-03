const axios = require("axios");

async function nanoBananaEdit(imageUrl, prompt, apikey) {
  const key = apikey || process.env.ONLYM_APIKEY || "onlymid";
  if (!imageUrl) throw new Error("imageUrl wajib diisi");
  if (!prompt) throw new Error("prompt wajib diisi");

  const apiUrl = `https://onlym.my.id/ai-image/nanobanana?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&apikey=${encodeURIComponent(key)}`;
  const { data } = await axios.get(apiUrl, {
    timeout: 172800000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!data || !data.status || !data.result || !data.result.url) throw new Error("API tidak mengembalikan URL gambar");

  return { status: true, prompt, result: data.result };
}

module.exports = { nanoBananaEdit };
