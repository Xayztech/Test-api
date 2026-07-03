import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const BASE = "https://id.vivoldi.com";
const PAGE = `${BASE}/tools/website-screen-capturer`;
const API = `${BASE}/tools/website-screen-capturer`;

const CONFIG = {
  input: "https://wikipedia.org",
  device: "desktop_fhd",
  browser: "chromium",
  height: "auto",
  quality: "auto",
  format: "png",
  delay: "2",
  retina: false,
  selector: ""
};

const DEVICES = {
  desktop_fhd: "1",
  desktop_qhd: "2",
  mobile: "4",
  tablet_portrait: "5",
  tablet_landscape: "6"
};

const BROWSERS = {
  chromium: "chromium",
  firefox: "firefox"
};

const QUALITIES = {
  auto: "auto",
  original: "0",
  high: "1",
  medium: "2",
  low: "3"
};

const FORMATS = {
  jpg: "jpg",
  png: "png"
};

const HEIGHTS = {
  auto: "auto",
  "8192": "8192",
  "10240": "10240",
  "12288": "12288",
  "14336": "14336",
  "16384": "16384",
  "18432": "18432",
  "20480": "20480",
  "22528": "22528",
  "24576": "24576",
  "26624": "26624",
  "28672": "28672",
  "30720": "30720",
  "32768": "32768",
  "34816": "34816",
  "38912": "38912",
  "43008": "43008"
};

const DELAYS = {
  "1": "1",
  "2": "2",
  "3": "3",
  "5": "5",
  "7": "7",
  "9": "9"
};

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    timeout: 120000,
    validateStatus: () => true,
    headers: {
      "user-agent": UA,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  })
);

function pick(map, key, fallback) {
  return map[key] || fallback;
}

function buildPayload(config) {
  const payload = {
    urls: config.input,
    client: pick(BROWSERS, config.browser, BROWSERS.chromium),
    height: pick(HEIGHTS, String(config.height), HEIGHTS.auto),
    quality: pick(QUALITIES, config.quality, QUALITIES.auto),
    agent: pick(DEVICES, config.device, DEVICES.desktop_fhd),
    export: pick(FORMATS, config.format, FORMATS.png),
    delay: pick(DELAYS, String(config.delay), DELAYS["2"]),
    querySelector: config.selector || ""
  };

  if (config.retina) payload.retinaYn = "Y";

  return payload;
}

async function initSession() {
  await client.get(PAGE, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      referer: "https://www.google.com/",
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "upgrade-insecure-requests": "1"
    }
  });
}

async function screenshot(config = CONFIG) {
  const payload = buildPayload(config);

  const res = await client.post(API, payload, {
    headers: {
      "api-post": "Y",
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/json",
      origin: BASE,
      referer: PAGE,
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      priority: "u=1, i"
    }
  });

  const ok =
    res.status >= 200 &&
    res.status < 300 &&
    res.data?.code === 0 &&
    !!res.data?.result?.downloadUrl;

  return {
    Status: ok,
    Code: res.status,
    Input: config.input,
    Device: config.device,
    Download_url: ok ? res.data.result.downloadUrl || null : null
  };
}

async function main() {
  try {
    await initSession();
    const result = await screenshot();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          Status: false,
          Code: 500,
          Input: CONFIG.input,
          Device: CONFIG.device,
          Download_url: null,
          Error: err.message
        },
        null,
        2
      )
    );
  }
}

module.exports = { pick, buildPayload, initSession, screenshot, main };
