const https = require('https')

class SpotifySearch {
  constructor() {
    this.baseUrl = 'https://api.spotify.com'
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Referer': 'https://open.spotify.com/',
      'Origin': 'https://open.spotify.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    }
  }

  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => resolve({ statusCode: res.statusCode, body }))
      })
      req.on('error', reject)
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => req.setHeader(k, v))
      }
      req.end()
    })
  }

  async getToken() {
    try {
      const response = await this.request('https://open.spotify.com/embed/track/3HHqVJHqwgkxWhOQ4MhLB6', {
        method: 'GET',
        headers: {
          ...this.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      })
      if (response.statusCode !== 200) return null
      const match = response.body.match(/"accessToken":"(BQ[^"]+)"/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  async search(query, limit = 10) {     // maks 10 list result
    if (!query || typeof query !== 'string') {
      return { success: false, message: 'Lagu tidak di temukan.' }
    }

    const token = await this.getToken()
    if (!token) {
      return { success: false, message: 'Bearer Token gagal di dapatkan' }
    }

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50))
    const payload = new URLSearchParams({
      q: query,
      type: 'track',
      limit: safeLimit.toString(),
      offset: '0'
    })

    try {
      const response = await this.request(`${this.baseUrl}/v1/search?${payload}`, {
        method: 'GET',
        headers: {
          ...this.headers,
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.statusCode !== 200) {
        return { success: false, message: `API Error: ${response.statusCode}` }
      }

      const data = JSON.parse(response.body)
      return this.formatData(data)
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  formatData(data) {
    if (!data.tracks || !data.tracks.items) {
      return { success: true, total: 0, results: [] }
    }

    const results = data.tracks.items.map(track => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      duration: this.formatTime(track.duration_ms),
      popularity: track.popularity,
      releaseDate: track.album.release_date,
      imageUrl: track.album.images[0] ? track.album.images[0].url : '',
      trackUrl: `https://open.spotify.com/track/${track.id}`
    }))

    return {
      success: true,
      results
    }
  }

  formatTime(ms) {
    const min = Math.floor(ms / 60000)
    const sec = ((ms % 60000) / 1000).toFixed(0)
    return `${min}:${sec.padStart(2, '0')}`
  }
}


// --- Testing Run :

module.exports = { SpotifySearch };
