// Author : ZenzzXD

const axios = require('axios')
const crypto = require('crypto')

const headers = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
  'origin': 'https://fastdl.app',
  'referer': 'https://fastdl.app/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site'
}

async function fastdl(url) {
  const { data: msc } = await axios.get('https://fastdl.app/msec', { headers })

  const ts = Date.now() - (Math.abs(Date.now() - Math.floor(msc.msec * 1000)) >= 60000 ? Date.now() - Math.floor(msc.msec * 1000) : 0)

  const sg = crypto
    .createHmac('sha256', Buffer.from('82314e32a384d00f055de496b4737acde3cbb2f851b90e1a70625f6d3bb56401', 'hex'))
    .update(url + ts)
    .digest('hex')

  const { data: result } = await axios.post('https://cors.siputzx.my.id/https://api-wh.fastdl.app/api/convert',
    new URLSearchParams({
      sf_url : url,
      ts     : ts.toString(),
      _ts    : '1778140969163',
      _tsc   : (Math.abs(Date.now() - Math.floor(msc.msec * 1000)) >= 60000 ? Date.now() - Math.floor(msc.msec * 1000) : 0).toString(),
      _sv    : '2',
      _s     : sg
    }).toString(),
    {
      headers: {
        ...headers
      }
    }
  )

  return { success: true, ...result }
}

module.exports = { fastdl };
