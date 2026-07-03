const axios = require("axios")

async function tiktokDl(url) {
  try {
    function formatNumber(integer) {
      return Number(integer).toLocaleString("id-ID")
    }

    function formatDate(n) {
      return new Date(n * 1000).toLocaleString("id-ID")
    }

    function fixUrl(u) {
      if (!u) return null
      if (u.startsWith("http")) return u
      return "https://www.tikwm.com" + u
    }

    const res = (
      await axios.post(
        "https://www.tikwm.com/api/",
        {},
        {
          params: { url, hd: 1 },
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json"
          }
        }
      )
    ).data.data

    let data = []

    // SLIDE FOTO
    if (res.duration == 0) {
      res.images.forEach(v => {
        data.push({ type: "photo", url: fixUrl(v) })
      })
    }
    // VIDEO
    else {
      data.push(
        { type: "watermark", url: fixUrl(res.wmplay) },
        { type: "nowatermark", url: fixUrl(res.play) },
        { type: "nowatermark_hd", url: fixUrl(res.hdplay) }
      )
    }

    return {
      status: true,
      title: res.title,
      taken_at: formatDate(res.create_time),
      region: res.region,
      id: res.id,
      duration: res.duration,
      cover: fixUrl(res.cover),
      data,
      music_info: {
        title: res.music_info.title,
        author: res.music_info.author,
        url: fixUrl(res.music_info.play)
      },
      stats: {
        views: formatNumber(res.play_count),
        likes: formatNumber(res.digg_count),
        comment: formatNumber(res.comment_count),
        share: formatNumber(res.share_count)
      },
      author: {
        id: res.author.id,
        username: res.author.unique_id,
        nickname: res.author.nickname,
        avatar: fixUrl(res.author.avatar)
      }
    }
  } catch (e) {
    return { status: false, error: e.message }
  }
}

module.exports = { tiktokDl }