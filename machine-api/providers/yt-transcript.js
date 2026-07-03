const axios = require("axios");

const extractVideoId = input => {
  const url = new URL(input)
  const host = url.hostname.replace("www.", "")

  if (host === "youtu.be") return url.pathname.slice(1)

  if (host === "youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v")
    if (url.pathname.startsWith("/shorts/"))
      return url.pathname.split("/")[2]
  }

  return null
}

const transcribe = async youtubeUrl => {
  const videoId = extractVideoId(youtubeUrl)

  const { data } = await axios.post(
    "https://yt-to-text.com/api/v1/Subtitles",
    { video_id: videoId },
    {
      headers: {
        Accept: "*/*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/json",
        Origin: "https://tubetranscript.com",
        Referer: "https://tubetranscript.com/",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": `"Chromium";v="139", "Not;A=Brand";v="99"`,
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": `"Android"`,
        "x-app-version": "1",
        "x-source": "tubetranscript"
      }
    }
  )

  return {
    status: 200,
    transcribe: (data.data?.transcripts || []).map(v => v.t).join(" ")
  }
}

module.exports = { transcribe };
