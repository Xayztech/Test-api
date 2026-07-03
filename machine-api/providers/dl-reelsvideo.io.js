const cheerio = require('cheerio')
const CryptoJS = require('crypto-js')
const axios = require('axios')
const querystring = require('querystring')

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': 'https://reelsvideo.io',
  'Referer': 'https://reelsvideo.io/',
  'X-Requested-With': 'XMLHttpRequest'
}

function generateTS() {
  return Math.floor(Date.now() / 1000)
}

function generateTT(ts) {
  return CryptoJS.MD5(ts + 'X-Fc-Pp-Ty-eZ').toString()
}

async function reelsvideo(instaUrl) {
  try {
    const ts = generateTS()
    const tt = generateTT(ts)

    const body = querystring.stringify({
      id: instaUrl,
      locale: 'en',
      tt,
      ts
    })

    const response = await axios.post(
      'https://reelsvideo.io/reel/',
      body,
      {
        headers,
        timeout: 15000,
        validateStatus: () => true // biar bisa lihat status asli
      }
    )

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`)
    }

    const $ = cheerio.load(response.data)

    const username =
      $('.bg-white span.text-400-16-18').first().text().trim() || null

    const thumb =
      $('div[data-bg]').first().attr('data-bg') || null

    const videos = []
    $('a.type_videos').each((_, el) => {
      const href = $(el).attr('href')
      if (href) videos.push(href)
    })

    const images = []
    $('a.type_images').each((_, el) => {
      const href = $(el).attr('href')
      if (href) images.push(href)
    })

    const mp3 = []
    $('a.type_audio').each((_, el) => {
      const href = $(el).attr('href')
      const id = $(el).attr('data-id')
      if (href && id) {
        mp3.push({ id, url: href })
      }
    })

    let type = 'unknown'
    if (videos.length && images.length) type = 'carousel'
    else if (videos.length) type = 'video'
    else if (images.length) type = 'photo'

    return {
      status: true,
      type,
      username,
      thumb,
      videos,
      images,
      mp3
    }

  } catch (err) {
    return {
      status: false,
      error: err.message
    }
  }
}

module.exports = { generateTS, generateTT, reelsvideo };
