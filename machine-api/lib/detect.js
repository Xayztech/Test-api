const RULES = [
  { app: "yt", label: "YouTube", regex: /(youtube\.com|youtu\.be)/i },
  { app: "tiktok", label: "TikTok", regex: /(tiktok\.com|vt\.tiktok)/i },
  { app: "spotify", label: "Spotify", regex: /open\.spotify\.com/i },
  { app: "instagram", label: "Instagram", regex: /instagram\.com/i },
  { app: "facebook", label: "Facebook", regex: /(facebook\.com|fb\.watch)/i },
  { app: "twitter", label: "Twitter / X", regex: /(twitter\.com|x\.com)/i },
  { app: "capcut", label: "CapCut", regex: /capcut\.com/i },
  { app: "douyin", label: "Douyin", regex: /douyin\.com/i },
  { app: "mediafire", label: "Mediafire", regex: /mediafire\.com/i },
  { app: "applemusic", label: "Apple Music", regex: /music\.apple\.com/i }
];

function detectPlatform(url) {
  if (!url || typeof url !== "string") {
    return { detected: false, app: null, label: null, url };
  }
  for (const rule of RULES) {
    if (rule.regex.test(url)) {
      return { detected: true, app: rule.app, label: rule.label, url };
    }
  }
  return { detected: false, app: null, label: null, url };
}

module.exports = { detectPlatform, RULES };
