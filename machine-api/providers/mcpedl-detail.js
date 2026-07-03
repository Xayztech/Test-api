import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const INPUT = "https://mcpedl.com/lunac-shaders/";
const DOWNLOAD_FILE = true;
const MAIN_DOWNLOAD_ONLY = true;
const OUTPUT_DIR = path.join(process.cwd(), "mcpedl-downloads");
const DESCRIPTION_LIMIT = 900;

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const api = axios.create({
  baseURL: "https://api.mcpedl.com",
  timeout: 30000,
  validateStatus: () => true,
  headers: {
    "user-agent": UA,
    "accept": "application/json",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "origin": "https://mcpedl.com",
    "referer": "https://mcpedl.com/"
  }
});

const web = axios.create({
  timeout: 60000,
  maxRedirects: 10,
  validateStatus: () => true,
  headers: {
    "user-agent": UA,
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "referer": "https://mcpedl.com/"
  }
});

function getSlug(input) {
  const raw = String(input || "").trim();

  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || raw;
  } catch {
    return raw
      .replace(/^https?:\/\/(?:www\.)?mcpedl\.com\//i, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .trim();
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value, limit = DESCRIPTION_LIMIT) {
  const text = cleanText(value);
  if (!limit || text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
}

function normalizeUrl(url) {
  const text = decodeHtml(String(url || "").trim());

  try {
    return new URL(text, "https://mcpedl.com").toString();
  } catch {
    return null;
  }
}

function extractRemoteUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;

  try {
    const u = new URL(normalized);
    const remote = u.searchParams.get("remoteUrl");

    if (remote) return decodeURIComponent(remote);

    return normalized;
  } catch {
    return normalized;
  }
}

function getFileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const name = decodeURIComponent(path.basename(u.pathname));
    return name || "download.bin";
  } catch {
    return "download.bin";
  }
}

function sanitizeFileName(name) {
  return String(name || "download.bin")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "download.bin";
}

function isDirectFile(url) {
  return /\.(mcpack|mcaddon|mcworld|zip|rar|7z|png|jpg|jpeg|webp|gif|apk|json|txt)(\?|#|$)/i.test(url || "");
}

function getLinksFromHtml(html) {
  const links = [];
  const text = String(html || "");
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const href = match[1];
    const label = cleanText(match[2]);
    const url = extractRemoteUrl(href);

    if (!url) continue;

    links.push({
      Name: label || getFileNameFromUrl(url),
      Url: url,
      Direct: isDirectFile(url),
      Source: "description"
    });
  }

  return links;
}

function getImagesFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const url = normalizeUrl(match[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  return found;
}

function getVideosFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const url = normalizeUrl(match[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  return found;
}

function uniqueLinks(items) {
  const map = new Map();

  for (const item of items) {
    if (!item?.Url) continue;
    if (!map.has(item.Url)) map.set(item.Url, item);
  }

  return [...map.values()];
}

function buildDownloads(data) {
  const d = data || {};

  const apiDownloads = Array.isArray(d.downloads) ? d.downloads.map(x => {
    const url = x.file || x.url || x.download_url || null;

    return {
      Id: x.id ?? null,
      Name: x.display_name || x.name || getFileNameFromUrl(url),
      Url: url,
      Direct: isDirectFile(url),
      Type: x.type ?? null,
      File_date: x.fileDate ?? null,
      Source: "api"
    };
  }).filter(x => x.Url) : [];

  const htmlDownloads = getLinksFromHtml(d.description).filter(x => {
    const lower = `${x.Name} ${x.Url}`.toLowerCase();

    if (lower.includes("download")) return true;
    if (lower.includes(".mcpack")) return true;
    if (lower.includes(".mcaddon")) return true;
    if (lower.includes(".mcworld")) return true;
    if (lower.includes(".zip")) return true;
    if (lower.includes("link-hub.net")) return true;
    if (lower.includes("link-center.net")) return true;
    if (lower.includes("direct-link.net")) return true;
    if (lower.includes("lootlinks")) return true;
    if (lower.includes("loot-link")) return true;
    if (lower.includes("linkvertise")) return true;

    return false;
  });

  const all = uniqueLinks([...apiDownloads, ...htmlDownloads]);

  return {
    All: all,
    Direct: all.filter(x => x.Direct),
    External: all.filter(x => !x.Direct)
  };
}

function getVersionScore(name) {
  const text = String(name || "");
  const matches = [...text.matchAll(/v?(\d+(?:\.\d+)+|\d+)/gi)];

  if (!matches.length) return 0;

  return Math.max(...matches.map(match => {
    return match[1]
      .split(".")
      .map(Number)
      .reduce((total, num, index) => total + num / Math.pow(100, index), 0);
  }));
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+(\?|#.*)?$/i, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTitleWords(detail = {}) {
  const raw = [
    detail.title,
    detail.slug,
    detail.short_description,
    detail.username,
    detail.user?.display_name
  ].filter(Boolean).join(" ");

  const blacklist = new Set([
    "minecraft",
    "mcpe",
    "mcbe",
    "bedrock",
    "addon",
    "addons",
    "texture",
    "textures",
    "pack",
    "packs",
    "shader",
    "shaders",
    "map",
    "skin",
    "download",
    "official",
    "edition",
    "android",
    "windows",
    "ios",
    "support",
    "supports"
  ]);

  return normalizeName(raw)
    .split(" ")
    .filter(x => x.length >= 3 && !blacklist.has(x));
}

function pickMainDownload(downloads, detail = {}) {
  const direct = Array.isArray(downloads?.Direct) ? downloads.Direct : [];
  if (!direct.length) return null;

  const titleWords = getTitleWords(detail);

  const scored = direct.map((item, index) => {
    const name = normalizeName(`${item.Name || ""} ${item.Url || ""}`);
    let score = 0;

    for (const word of titleWords) {
      if (name.includes(word)) score += 12;
    }

    if (name.includes("main")) score += 10;
    if (name.includes("latest")) score += 8;
    if (name.includes("release")) score += 6;
    if (name.includes("merged")) score += 5;
    if (name.includes("universal")) score += 5;
    if (name.includes("all")) score += 3;
    if (name.includes("android")) score += 2;
    if (name.includes("windows")) score += 1;
    if (name.includes("ios")) score += 1;
    if (name.includes("old")) score -= 8;
    if (name.includes("beta")) score -= 4;
    if (name.includes("preview")) score -= 4;
    if (name.includes(".mcpack")) score += 5;
    if (name.includes(".mcaddon")) score += 5;
    if (name.includes(".mcworld")) score += 5;
    if (name.includes(".zip")) score += 2;

    score += getVersionScore(name);
    score -= index / 1000;

    return {
      item,
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.item || direct[0];
}

async function getDetail(slug) {
  const res = await api.get(`/api/route/slug/${encodeURIComponent(slug)}`);

  if (res.status < 200 || res.status >= 300 || !res.data?.data) {
    throw {
      status: res.status,
      data: res.data
    };
  }

  return res.data.data;
}

async function downloadFile(url, name) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const filename = sanitizeFileName(name || getFileNameFromUrl(url));
  const output = path.join(OUTPUT_DIR, filename);
  const res = await web.get(url, {
    responseType: "stream"
  });

  if (res.status < 200 || res.status >= 300) {
    return {
      Status: false,
      Code: res.status,
      Url: url,
      File: null
    };
  }

  await pipeline(res.data, fs.createWriteStream(output));

  return {
    Status: true,
    Code: res.status,
    Url: url,
    File: output
  };
}

async function main() {
  const slug = getSlug(INPUT);

  try {
    const d = await getDetail(slug);
    const downloads = buildDownloads(d);
    const mainDownload = pickMainDownload(downloads, d);
    const downloaded = [];

    if (DOWNLOAD_FILE) {
      if (MAIN_DOWNLOAD_ONLY) {
        if (mainDownload) {
          downloaded.push(await downloadFile(mainDownload.Url, mainDownload.Name));
        }
      } else {
        for (const item of downloads.Direct) {
          downloaded.push(await downloadFile(item.Url, item.Name));
        }
      }
    }

    console.log(JSON.stringify({
      Status: true,
      Code: 200,
      Input: INPUT,
      Slug: slug,
      Result: {
        Id: d.id ?? null,
        Submission_id: d.submission_id ?? null,
        Title: d.title ?? null,
        Slug: d.slug ?? slug,
        Url: d.slug ? `https://mcpedl.com/${d.slug}/` : `https://mcpedl.com/${slug}/`,
        Author: d.username || d.user?.display_name || d.user?.username || null,
        Status: d.status ?? null,
        Type_id: d.type_id ?? null,
        Publish_date: d.publish_date ?? null,
        Update_date: d.update_date ?? null,
        Rating: d.average_rating ?? d.comments_rating?.average ?? null,
        Comments_total: d.comments_total ?? null,
        Short_description: limitText(d.short_description, 300),
        Description: limitText(d.description),
        Changelog: limitText(d.changelog, 500),
        Image: d.image ?? null,
        Thumbnails: d.thumbnails ?? null,
        Images: Array.isArray(d.submission_images) && d.submission_images.length ? d.submission_images : getImagesFromHtml(d.description),
        Videos: Array.isArray(d.submission_videos) && d.submission_videos.length ? d.submission_videos : getVideosFromHtml(d.description),
        Categories: Array.isArray(d.categories) ? d.categories.map(x => ({
          Id: x.id ?? null,
          Name: x.name ?? null,
          Slug: x.slug ?? null
        })) : [],
        Tags: Array.isArray(d.cf_tags) ? d.cf_tags.map(x => ({
          Id: x.id ?? null,
          Name: x.name ?? null,
          Slug: x.slug ?? null,
          Url: x.url ?? null
        })) : [],
        Downloads: {
          Total: downloads.All.length,
          Direct_total: downloads.Direct.length,
          External_total: downloads.External.length,
          Main: mainDownload,
          Direct: downloads.Direct,
          External: downloads.External
        },
        Downloaded: downloaded,
        Related: Array.isArray(d.related) ? d.related.slice(0, 8).map(x => ({
          Id: x.id ?? null,
          Title: x.title ?? null,
          Slug: x.slug ?? null,
          Url: x.slug ? `https://mcpedl.com/${x.slug}/` : null,
          Image: x.image ?? null
        })) : []
      }
    }, null, 2));
  } catch (err) {
    console.log(JSON.stringify({
      Status: false,
      Code: err.status || err.response?.status || 500,
      Input: INPUT,
      Slug: slug,
      Error: err.data || err.message || err
    }, null, 2));
  }
}

module.exports = { getSlug, decodeHtml, cleanText, limitText, normalizeUrl, extractRemoteUrl, getFileNameFromUrl, sanitizeFileName, isDirectFile, getLinksFromHtml, getImagesFromHtml, getVideosFromHtml, uniqueLinks, buildDownloads, getVersionScore, normalizeName, getTitleWords, pickMainDownload, getDetail, downloadFile, main };
