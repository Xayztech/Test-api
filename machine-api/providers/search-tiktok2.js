import crypto from "node:crypto";

const KEYWORDS = "Bmw M4";
const TIKTOK_URL = "https://vt.tiktok.com/ZSQfMfpET/";
const COUNT = 12;
const CURSOR = 0;
const HD = 1;

const BASE_URL = "https://www.tikwm.com";
const API_URL = `${BASE_URL}/api/photo/search`;

function randomUniqueId() {
  return `user_${crypto.randomBytes(6).toString("hex")}`;
}

function fullUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return BASE_URL + url;
}

async function tikwmPhotoSearch({ keywords, url, count, cursor, hd }) {
  if (!keywords) {
    throw new Error("Keywords kosong");
  }

  if (!url) {
    throw new Error("URL TikTok kosong");
  }

  const started = Date.now();
  const uniqueId = randomUniqueId();

  const params = new URLSearchParams({
    unique_id: uniqueId,
    count: String(count),
    cursor: String(cursor),
    web: "1",
    hd: String(hd),
    keywords,
    url
  });

  const headers = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    Origin: BASE_URL,
    Referer: `${BASE_URL}/`
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: params
  });

  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!json) {
    return {
      Status: false,
      Code: response.status,
      Input: {
        Keywords: keywords,
        Url: url
      },
      Result: [],
      Error: "Response bukan JSON",
      Preview: text.slice(0, 500),
      Time_ms: Date.now() - started
    };
  }

  const videos = Array.isArray(json?.data?.videos) ? json.data.videos : [];

  return {
    Status: response.ok && json.code === 0,
    Code: response.ok && json.code === 0 ? 200 : json.code || response.status,
    Input: {
      Keywords: keywords,
      Url: url
    },
    Total: videos.length,
    Cursor: json?.data?.cursor ?? null,
    Has_more: json?.data?.hasMore ?? false,
    Result: videos.map((item) => ({
      Id: item.video_id || item.id || null,
      Title: item.title || null,
      Author: item.author?.nickname || item.author?.unique_id || null,
      Cover: fullUrl(item.cover),
      Music: fullUrl(item.music),
      Images_total: Array.isArray(item.images) ? item.images.length : 0,
      Images: Array.isArray(item.images) ? item.images : [],
      Stats: {
        Play: item.play_count || 0,
        Like: item.digg_count || 0,
        Comment: item.comment_count || 0,
        Share: item.share_count || 0
      }
    })),
    Time_ms: Date.now() - started
  };
}

async function main() {
  try {
    const result = await tikwmPhotoSearch({
      keywords: KEYWORDS,
      url: TIKTOK_URL,
      count: COUNT,
      cursor: CURSOR,
      hd: HD
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          Status: false,
          Code: 500,
          Input: {
            Keywords: KEYWORDS,
            Url: TIKTOK_URL
          },
          Result: [],
          Error: error.message
        },
        null,
        2
      )
    );
  }
}

module.exports = { randomUniqueId, fullUrl, tikwmPhotoSearch, main };
