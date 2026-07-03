import { URLSearchParams } from 'node:url'

async function getSession() {
  const res = await fetch('https://on4t.com/online-video-downloader', {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'id,en-US;q=0.7,en;q=0.3'
    }
  })

  const html = await res.text()
  const token =
    html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/name=["']_token["']\s+value=["']([^"']+)["']/i)?.[1] ||
    html.match(/"_token"\s*:\s*"([^"]+)"/i)?.[1]

  if (!token) throw new Error('token')

  const cookies = []
  if (typeof res.headers.getSetCookie === 'function') {
    cookies.push(...res.headers.getSetCookie())
  } else {
    res.headers.forEach((v, k) => k.toLowerCase() === 'set-cookie' && cookies.push(v))
  }

  const cookie = cookies
    .map(v => v.split(';')[0])
    .join('; ')

  return { token, cookie }
}

module.exports = { getSession };
