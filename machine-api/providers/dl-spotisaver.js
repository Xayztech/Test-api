import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://spotisaver.net";
const INPUT = "https://open.spotify.com/track/3RY0NyQQXxuAiyk5eAS4fC?si=zEuiEFLWTl2Wq65LKySdOw";
const LANG = "en";
const DOWNLOAD_DIR = "downloads";
const FILENAME_TAG = "SPOTISAVER";

const MAX_DOWNLOAD_RETRY = 5;
const RETRY_DELAYS = [5000, 8000, 12000, 18000, 25000];

const ua = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

let cookieStore = {
  "_s-uid": `v_${Math.random().toString(16).slice(2, 16)}.${Math.floor(Math.random() * 100000000)}`,
  lang: LANG
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanInput(input) {
  return String(input || "")
    .trim()
    .replace(/%0A/gi, "")
    .replace(/%0D/gi, "")
    .replace(/\r|\n/g, "");
}

function randomIp() {
  return [
    Math.floor(Math.random() * 223) + 1,
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  ].join(".");
}

function cookieHeader() {
  return Object.entries(cookieStore)
    .filter(([, v]) => v !== undefined && v !== null && String(v).length)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function splitSetCookie(value) {
  if (!value) return [];
  return value.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g);
}

function saveCookies(headers) {
  const raw = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : splitSetCookie(headers.get("set-cookie"));

  for (const item of raw) {
    const part = item.split(";")[0];
    const i = part.indexOf("=");
    if (i > -1) cookieStore[part.slice(0, i)] = part.slice(i + 1);
  }
}

function jsonBase64(data) {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function parseSpotify(input) {
  const cleaned = cleanInput(input);
  const url = new URL(cleaned);
  const parts = url.pathname.split("/").filter(Boolean);

  return {
    raw: cleaned,
    type: parts[0] || "track",
    id: parts[1] || cleaned
  };
}

function safeName(name) {
  return String(name || "spotify-audio.mp3")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return null;

  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let i = 0;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function getFilenameFromDisposition(disposition) {
  if (!disposition) return null;

  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) return decodeURIComponent(utf[1].replace(/^"|"$/g, ""));

  const normal = disposition.match(/filename="([^"]+)"/i);
  if (normal?.[1]) return normal[1];

  return null;
}

function isHtml(text, contentType) {
  return contentType.includes("text/html") || /^\s*<!doctype html|^\s*<html/i.test(text);
}

function parseMaybeJson(buffer, contentType) {
  const text = buffer.toString("utf8");
  let json = null;

  if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      json = JSON.parse(text);
    } catch {}
  }

  return { text, json };
}

async function warmup(parsed) {
  const urls = [
    `${BASE_URL}/en1`,
    `${BASE_URL}/en/${parsed.type}/${parsed.id}/`
  ];

  for (const url of urls) {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(60000),
      headers: {
        "user-agent": ua,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookieHeader()
      }
    }).catch(() => null);

    if (res) {
      saveCookies(res.headers);
      await res.arrayBuffer().catch(() => null);
    }
  }
}

async function requestJson(url, extraHeaders = {}, referer = `${BASE_URL}/en1`) {
  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(60000),
    headers: {
      "user-agent": ua,
      "accept": "application/json",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
      "sec-ch-ua-mobile": "?1",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "referer": referer,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "cookie": cookieHeader(),
      "priority": "u=1, i",
      ...extraHeaders
    }
  });

  saveCookies(res.headers);

  const text = await res.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {}

  return {
    code: res.status,
    ok: res.ok,
    contentType: res.headers.get("content-type") || "",
    text,
    data
  };
}

async function requestDownloadOnce(url, body, referer) {
  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(120000),
    headers: {
      "user-agent": ua,
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
      "sec-ch-ua-mobile": "?1",
      "content-type": "application/json",
      "accept": "*/*",
      "origin": BASE_URL,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "referer": referer,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "cookie": cookieHeader(),
      "priority": "u=1, i"
    },
    body: JSON.stringify(body)
  });

  saveCookies(res.headers);

  const contentType = res.headers.get("content-type") || "";
  const disposition = res.headers.get("content-disposition") || "";
  const buffer = Buffer.from(await res.arrayBuffer());
  const parsed = parseMaybeJson(buffer, contentType);

  return {
    code: res.status,
    ok: res.ok,
    contentType,
    disposition,
    buffer,
    text: parsed.text,
    json: parsed.json
  };
}

async function requestDownload(url, body, referer) {
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_DOWNLOAD_RETRY; attempt++) {
    const dl = await requestDownloadOnce(url, body, referer);

    const errorText = dl.json?.error || dl.text.slice(0, 200);
    const noSlots = dl.json?.error === "No available slots" || dl.text.includes("No available slots");

    attempts.push({
      Attempt: attempt,
      Code: dl.code,
      Content_type: dl.contentType,
      Error: dl.contentType.includes("audio") ? null : errorText,
      Retry: noSlots && attempt < MAX_DOWNLOAD_RETRY
    });

    if (dl.ok && dl.contentType.includes("audio")) {
      return {
        ...dl,
        ok: true,
        attempts
      };
    }

    if (!noSlots || attempt >= MAX_DOWNLOAD_RETRY) {
      return {
        ...dl,
        ok: false,
        attempts
      };
    }

    await sleep(RETRY_DELAYS[attempt - 1] || 25000);
  }

  return {
    code: 500,
    ok: false,
    contentType: "application/json",
    disposition: "",
    buffer: Buffer.from(JSON.stringify({ error: "Max retry reached" })),
    text: JSON.stringify({ error: "Max retry reached" }),
    json: { error: "Max retry reached" },
    attempts
  };
}

async function getSignature(action, ctxPayload, referer) {
  const ctx = jsonBase64(ctxPayload);
  const url = `${BASE_URL}/api/get_signature.php?action=${encodeURIComponent(action)}&ctx=${encodeURIComponent(ctx)}`;
  return await requestJson(url, {}, referer);
}

async function main() {
  const started = Date.now();
  const parsed = parseSpotify(INPUT);
  const cleanUrl = parsed.raw;
  const pageReferer = `${BASE_URL}/en/${parsed.type}/${parsed.id}/`;
  const autoIp = randomIp();

  await warmup(parsed);

  const playlistSig = await getSignature("get_playlist", {
    id: parsed.id,
    type: parsed.type,
    lang: LANG
  }, pageReferer);

  if (!playlistSig.ok || !playlistSig.data?.success || !playlistSig.data?.token || !playlistSig.data?.exp) {
    console.log(JSON.stringify({
      Status: false,
      Code: playlistSig.code,
      Input: cleanUrl,
      Step: "playlist_signature",
      Error: playlistSig.data || playlistSig.text.slice(0, 500),
      Need_cf_clearance: isHtml(playlistSig.text, playlistSig.contentType) || playlistSig.code === 403,
      Time_ms: Date.now() - started
    }, null, 2));
    return;
  }

  const playlistUrl = `${BASE_URL}/api/get_playlist.php?id=${encodeURIComponent(parsed.id)}&type=${encodeURIComponent(parsed.type)}&lang=${encodeURIComponent(LANG)}`;

  const playlist = await requestJson(playlistUrl, {
    "x-pe": String(playlistSig.data.exp),
    "x-pt": String(playlistSig.data.token)
  }, pageReferer);

  if (!playlist.ok || !playlist.data?.tracks?.length) {
    console.log(JSON.stringify({
      Status: false,
      Code: playlist.code,
      Input: cleanUrl,
      Step: "playlist",
      Error: playlist.data || playlist.text.slice(0, 500),
      Need_cf_clearance: isHtml(playlist.text, playlist.contentType) || playlist.code === 403,
      Time_ms: Date.now() - started
    }, null, 2));
    return;
  }

  const info = playlist.data.playlist_info || {};
  const track = playlist.data.tracks[0];
  const realTrackId = track.id || parsed.id;
  const realReferer = `${BASE_URL}/en/track/${realTrackId}/`;

  const downloadCtx = {
    lang: LANG,
    id: String(realTrackId),
    name: String(track.name || ""),
    duration_ms: String(track.duration_ms || "")
  };

  const downloadSig = await getSignature("download_track", downloadCtx, realReferer);

  if (!downloadSig.ok || !downloadSig.data?.success || !downloadSig.data?.token || !downloadSig.data?.exp) {
    console.log(JSON.stringify({
      Status: false,
      Code: downloadSig.code,
      Input: cleanUrl,
      Step: "download_signature",
      Ctx: downloadCtx,
      Error: downloadSig.data || downloadSig.text.slice(0, 500),
      Need_cf_clearance: isHtml(downloadSig.text, downloadSig.contentType) || downloadSig.code === 403,
      Time_ms: Date.now() - started
    }, null, 2));
    return;
  }

  const sigPayload = jsonBase64({
    token: String(downloadSig.data.token),
    exp: String(downloadSig.data.exp)
  });

  const dlUrl = `${BASE_URL}/api/download_track.php?sig=${encodeURIComponent(sigPayload)}`;

  const body = {
    track,
    download_dir: DOWNLOAD_DIR,
    filename_tag: FILENAME_TAG,
    user_ip: autoIp,
    is_premium: false,
    lang: LANG
  };

  const dl = await requestDownload(dlUrl, body, realReferer);

  if (!dl.ok || !dl.contentType.includes("audio")) {
    const raw = dl.text || dl.buffer.toString("utf8");

    console.log(JSON.stringify({
      Status: false,
      Code: dl.code,
      Input: cleanUrl,
      Step: "download",
      Content_type: dl.contentType,
      Error: dl.json || raw.slice(0, 500),
      Need_cf_clearance: raw.includes("verification") || raw.includes("cf") || dl.code === 403,
      Attempts: dl.attempts || [],
      Time_ms: Date.now() - started
    }, null, 2));
    return;
  }

  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

  const headerName = getFilenameFromDisposition(dl.disposition);
  const filename = safeName(headerName || `${track.artists?.join(", ") || info.owner || "Spotify"} - ${track.name || info.name || realTrackId} (${FILENAME_TAG}).mp3`);
  const filepath = path.join(DOWNLOAD_DIR, filename);

  fs.writeFileSync(filepath, dl.buffer);

  console.log(JSON.stringify({
    Status: true,
    Code: dl.code,
    Input: cleanUrl,
    Id: realTrackId,
    Type: info.type || "track",
    Title: track.name || info.name || null,
    Artists: track.artists || [],
    Album: track.album || null,
    Duration_ms: track.duration_ms || null,
    Release_date: track.release_date || null,
    Cover: track.image?.url || info.images?.[0]?.url || null,
    External_url: track.external_url || info.external_url || cleanUrl,
    Format: "mp3",
    Content_type: dl.contentType,
    Size: formatBytes(dl.buffer.length),
    Filename: filename,
    Filepath: filepath,
    Token_exp: downloadSig.data.exp,
    Attempts: dl.attempts || [],
    Time_ms: Date.now() - started
  }, null, 2));
}

module.exports = { sleep, cleanInput, randomIp, cookieHeader, splitSetCookie, saveCookies, jsonBase64, parseSpotify, safeName, formatBytes, getFilenameFromDisposition, isHtml, parseMaybeJson, warmup, requestJson, requestDownloadOnce, requestDownload, getSignature, main };
