import axios from "axios"
import crypto from "crypto"

const KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")

function getYouTubeId(url) {
  const match = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function decryptData(base64) {
  const encrypted = Buffer.from(base64, "base64")
  const iv = encrypted.subarray(0, 16)

  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, iv)

  const decrypted = Buffer.concat([
    decipher.update(encrypted.subarray(16)),
    decipher.final()
  ])

  return JSON.parse(decrypted.toString())
}

function formatDuration(seconds = 0) {
  seconds = Number(seconds) || 0
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

async function savetube(link, quality = "720") {
  try {
    if (!link) throw new Error("Link nya mana?")

    const videoId = getYouTubeId(link)
    if (!videoId) throw new Error("URL YouTube tidak valid")

    const allowed = ["144", "240", "360", "480", "720", "1080", "mp3"]
    quality = String(quality).toLowerCase()

    if (!allowed.includes(quality)) {
      throw new Error("Quality tersedia: 144, 240, 360, 480, 720, 1080, mp3")
    }

    const client = axios.create({
      timeout: 30000,
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/plain, */*",
        "origin": "https://yt.savetube.me",
        "referer": "https://yt.savetube.me/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36"
      }
    })

    const cdnReq = await client.get("https://media.savetube.vip/api/random-cdn")
    const cdn = cdnReq.data?.cdn

    if (!cdn) throw new Error("Gagal mengambil CDN")

    const baseUrl = cdn.startsWith("http") ? cdn : `https://${cdn}`

    const infoReq = await client.post(`${baseUrl}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${videoId}`
    })

    const encryptedData = infoReq.data?.data
    if (!encryptedData) throw new Error("Data info tidak ditemukan")

    const meta = decryptData(encryptedData)

    if (!meta?.key) throw new Error("Key download tidak ditemukan")

    const downloadType = quality === "mp3" ? "audio" : "video"
    const q = quality === "mp3" ? "128" : quality

    const downloadReq = await client.post(`${baseUrl}/download`, {
      id: videoId,
      downloadType,
      quality: q,
      key: meta.key
    })

    const dl =
      downloadReq.data?.data?.downloadUrl ||
      downloadReq.data?.downloadUrl ||
      downloadReq.data?.data?.url

    if (!dl) throw new Error("Download URL tidak ditemukan")

    return {
      status: true,
      title: meta.title || "Unknown Title",
      type: downloadType,
      quality: quality === "mp3" ? "128kbps" : `${q}p`,
      duration: formatDuration(meta.duration),
      thumbnail:
        meta.thumbnail ||
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      download: dl
    }
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || "Terjadi kesalahan"
    }
  }
}

module.exports = { getYouTubeId, decryptData, formatDuration, savetube };
