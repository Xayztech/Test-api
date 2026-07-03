const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_FILE = path.join(__dirname, "..", "data", "shortlinks.json");

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function makeCode(len = 6) {
  return crypto.randomBytes(8).toString("base64url").slice(0, len);
}

function createShortlink(longUrl, customCode) {
  if (!longUrl || !/^https?:\/\//i.test(longUrl)) {
    throw new Error("URL tidak valid, harus diawali http:// atau https://");
  }
  const db = loadDb();
  let code = customCode && /^[a-zA-Z0-9_-]{3,32}$/.test(customCode) ? customCode : makeCode();

  if (db[code] && customCode) {
    throw new Error("Kode custom sudah dipakai");
  }
  while (db[code] && !customCode) {
    code = makeCode();
  }

  db[code] = {
    url: longUrl,
    createdAt: new Date().toISOString(),
    clicks: 0
  };
  saveDb(db);
  return { code, url: longUrl };
}

function resolveShortlink(code) {
  const db = loadDb();
  const entry = db[code];
  if (!entry) throw new Error("Shortlink tidak ditemukan");
  entry.clicks += 1;
  db[code] = entry;
  saveDb(db);
  return entry;
}

module.exports = { createShortlink, resolveShortlink };
