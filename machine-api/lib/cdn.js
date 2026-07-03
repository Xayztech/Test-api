const axios = require("axios");
const NodeID3 = require("node-id3");

async function streamDownload(req, res) {
  const { url, filename, type, title, artist, thumbnail } = req.query;
  if (!url) return res.status(400).json({ status: false, error: "Parameter url wajib diisi" });

  try {
    const upstream = await axios.get(url, {
      responseType: type === "mp3" ? "arraybuffer" : "stream",
      timeout: 172800000,
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const safeName = (filename || "machineapi-download").replace(/[^a-zA-Z0-9._-]/g, "_");

    if (type === "mp3") {
      let buffer = Buffer.from(upstream.data);
      try {
        let imageBuffer = null;
        if (thumbnail) {
          const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer", timeout: 172800000 });
          imageBuffer = Buffer.from(imgRes.data);
        }
        const tags = {
          title: title || safeName,
          artist: artist || "Machine API",
          image: imageBuffer ? { mime: "image/jpeg", type: { id: 3, name: "front cover" }, description: "cover", imageBuffer } : undefined
        };
        const tagged = NodeID3.write(tags, buffer);
        if (tagged) buffer = tagged;
      } catch (metaErr) {
        console.warn("[cdn] gagal menulis metadata mp3:", metaErr.message);
      }

      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.mp3"`);
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(buffer);
    }

    const ext = type === "audio" ? "mp3" : "mp4";
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.${ext}"`);
    res.setHeader("Content-Type", upstream.headers["content-type"] || "application/octet-stream");
    upstream.data.pipe(res);
  } catch (err) {
    res.status(502).json({ status: false, error: `Gagal mengunduh dari sumber: ${err.message}` });
  }
}

module.exports = { streamDownload };
