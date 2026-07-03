//credit : © nazir
const axios = require("axios")
const randomChar = (char, range) => {
  let chars = ""
  for (let i = 0; i < range; i++) {
    chars += char[Math.floor(Math.random() * char.length)]
  }
  return chars
}
const generateDeviceId = () => {
  const prefix = "7"
  const random = randomChar("0123456789", 18)
  return `${prefix}${random}`
}
const resolve = async u => {
  if (!u.includes("vt.tiktok.com")) return u
    const r = await axios.get(u, {
      maxRedirects: 0,
      validateStatus: s => s >= 200 && s < 400
    })
    return r.headers.location || u
}
const makeqs = (id) => {
  return new URLSearchParams({
  aweme_id: id, version_name: "1.1.9", version_code: "2018111632", device_id: generateDeviceId(), iid: generateDeviceId(), manifest_version_code: "2018111632", update_version_code: "2018111632", openudid: randomChar("0123456789abcdef", 16), uuid: randomChar("1234567890", 16), _rticket: Date.now() * 1000, ts: Date.now(), device_brand: "Vivo", device_type: "V2039", device_platform: "android", resolution: "1080*1920", dpi: 460, os_version: "11", sys_region: "US", region: "ID", timezone_name: "Asia/Makassar"}).toString()
}
async function download(url) {
  let urls = await resolve(url)
  const match = urls.match(/\/(video|photo)\/(\d+)/)
  let { data } = await axios(`https://api16-normal-useast5.tiktokv.us/aweme/v1/feed/?${makeqs(match[2])}`, {
    method: "OPTIONS",
    headers: { "User-Agent": "com.zhiliaoapp.musically/300904 (2018111632; U; Android 11; en_US; V2039; Build/QQ3A.200805.001; Cronet/58.0.2991.0)" }
  })
  const item = data?.aweme_list?.[0]
  if (!item) throw new Error("Data aweme kosong")
  const isVideo = !!item.video
  const stats = item.statistics ?? {}
  const author = item.author ?? {}
  const music = item.music ?? {}
  return {
    id: item.aweme_id,
    like: stats.digg_count ?? 0,
    views: stats.play_count,
    share: stats.share_count ?? 0,
    comment: stats.comment_count ?? 0,
    isVideo,
    title: item.desc ?? "",
    region: item.region ?? null,
    duration: `${Math.floor(item.video.duration / 1000)} second`,
    download: isVideo
      ? item.video?.play_addr.url_list?.[0]
      : item.image_post_info.images.map(img => img.display_image.url_list[0]) ?? [],
    author: {
      avatar: author.avatar_thumb?.url_list[0] ?? null,
      nickname: author.nickname ?? "",
      username: author.unique_id ?? ""
    },
    music: {
      id: music.id_str ?? null,
      title: music.title ?? "",
      author: music.author ?? "",
      url: music.play_url?.url_list?.[0] ?? null
    }
  }
}

module.exports = { download, randomChar, generateDeviceId, makeqs };
