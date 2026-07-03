// savefrom.js — ShanMolvyr | VYR::7f3a9c::MOLVYR

import crypto from 'crypto'
import vm from 'vm'
import axios from 'axios'

const HASHED = 'b7944d7a59c9cb654228624880e7de59a53842c2d912b449fdf11febcf81cb21'

const HEADERS = {
  'accept': '*/*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
  'sec-ch-ua-mobile': '?0',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
}

function generateHash(url, ts) {
  const data = url + ts + HASHED
  return crypto.createHash('sha256').update(data).digest('hex')
}

async function savefrom(url) {
  const ts = Date.now()
  const params = new URLSearchParams({
    sf_url: url, sf_submit: '', new: '2', lang: 'en', app: '',
    country: 'en', os: 'Windows', browser: 'Chrome', channel: 'main',
    'sf-nomad': '1', url, ts, _ts: 1720433117117,
    _tsc: 0, _s: generateHash(url, ts), _x: 1
  })

  const res = await axios.post('https://worker.savefrom.net/savefrom.php', params.toString(), {
    headers: {
      ...HEADERS,
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://en.savefrom.net',
      'referer': 'https://en.savefrom.net/'
    }
  })

  const data = res.data

  const mockEl = () => {
    const el = {
      firstChild: null, lastChild: null, parentNode: null, childNodes: [],
      innerHTML: '', innerText: '', textContent: '', value: '',
      style: {}, className: '', id: '', tagName: 'DIV',
      setAttribute: () => {}, getAttribute: () => null,
      appendChild(c) { this.childNodes.push(c); if (!this.firstChild) this.firstChild = c; this.lastChild = c; if (c) c.parentNode = this; return c },
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      cloneNode: () => mockEl(),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementsByTagName: () => [],
      getElementsByClassName: () => [],
      focus: () => {}, blur: () => {}, click: () => {},
    }
    return el
  }

  const mockDoc = {
    location: { href: 'https://en.savefrom.net/', hostname: 'en.savefrom.net' },
    referrer: '', title: '', cookie: '', readyState: 'complete',
    body: mockEl(), head: mockEl(),
    createElement: () => mockEl(),
    createTextNode(t) { const e = mockEl(); e.textContent = t; return e },
    createDocumentFragment: () => mockEl(),
    getElementById: () => null,
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  }

  const context = {
    results: null,
    parent: { document: mockDoc, location: mockDoc.location },
    frameElement: mockEl(),
    document: mockDoc,
    location: mockDoc.location,
    navigator: { userAgent: HEADERS['user-agent'], language: 'en-US' },
    screen: { width: 1920, height: 1080 },
    history: { pushState: () => {}, replaceState: () => {} },
    atob: (b64) => Buffer.from(b64, 'base64').toString(),
    btoa: (str) => Buffer.from(str).toString('base64'),
    setTimeout: () => {}, clearTimeout: () => {},
    setInterval: () => {}, clearInterval: () => {},
    requestAnimationFrame: () => {},
    console: { log: () => {}, error: () => {}, warn: () => {} },
    _decodeURIComponent: (uri) => {
      const decoded = decodeURIComponent(uri)
      if (/showResult/.test(decoded)) {
        context.results = decoded
        return 'true'
      }
      return decoded
    }
  }
  context.window = context
  vm.createContext(context)
  new vm.Script(`decodeURIComponent=_decodeURIComponent;${data}`).runInContext(context)

  const executed =
    context.results?.split('window.parent.sf.videoResult.show(')?.[1] ||
    context.results?.split('window.parent.sf.videoResult.showRows(')?.[1]

  if (!executed) throw new Error('Cannot find result from evaluation!')

  let json = null
  try {
    if (context.results.includes('showRows')) {
      const splits = executed.split('],"')
      const lastIndex = splits.findIndex(v => v.includes('window.parent.sf.enableElement'))
      json = JSON.parse(splits.slice(0, lastIndex).join('],"') + ']')
    } else {
      json = [JSON.parse(executed.split(');')[0])]
    }
  } catch {
    throw new Error('Cannot parse json results from evaluation!')
  }

  return json
}

module.exports = { generateHash, savefrom };
