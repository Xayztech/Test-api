require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");

const { REGISTRY } = require("./registry");
const { runFallback } = require("./lib/runFallback");
const { success, failure, META } = require("./lib/response");
const { chatWithGemini } = require("./lib/geminiChat");
const { detectPlatform } = require("./lib/detect");
const { createShortlink, resolveShortlink } = require("./lib/shortlink");
const { googleTranslate } = require("./lib/translate");
const { streamDownload } = require("./lib/cdn");

const app = express();
const PORT = process.env.PORT || 3000;
const REQUEST_TIMEOUT_MS = 1000 * 60 * 60 * 48;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("tiny"));

app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

const APPEARANCE_DIR = path.join(__dirname, "..", "appearance");
app.use("/assets", express.static(path.join(APPEARANCE_DIR, "assets"), {
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
}));

app.get("/", (req, res) => res.redirect(302, "/home/id"));

app.get(["/home/:lang", "/ai/:lang", "/shortlink/:lang", "/docs/:lang", "/downloader/:lang"], (req, res) => {
  res.sendFile(path.join(APPEARANCE_DIR, "index.html"));
});

function pickInput(req) {
  return Object.assign({}, req.query, req.body, req.params);
}

app.get("/api", (req, res) => {
  const categories = {};
  for (const [key, val] of Object.entries(REGISTRY)) {
    categories[key] = {
      label: val.label,
      actions: Object.keys(val).filter((k) => k !== "label")
    };
  }
  res.json(success({
    message: "Machine API siap digunakan",
    categories,
    usage: "/api/:app/:action?url=... atau ?q=..."
  }));
});

app.get("/api/ping", (req, res) => {
  res.json(success({ pong: true }));
});

app.all("/api/ai/chat", async (req, res) => {
  const started = Date.now();
  try {
    const input = pickInput(req);
    const message = input.message || input.text || input.q || "";
    let history = input.history || [];
    let files = input.files || [];

    if (typeof history === "string") {
      try { history = JSON.parse(history); } catch { history = []; }
    }
    if (typeof files === "string") {
      try { files = JSON.parse(files); } catch { files = []; }
    }

    const result = await chatWithGemini({ message, history, files });
    res.json(success(result, { ping: `${Date.now() - started}ms` }));
  } catch (err) {
    res.status(500).json(failure(err.message));
  }
});

app.all("/api/detect", async (req, res) => {
  const input = pickInput(req);
  const url = input.url || input.link || "";
  res.json(success(detectPlatform(url)));
});

app.post("/api/translate", async (req, res) => {
  const started = Date.now();
  try {
    const { text, target, source } = req.body || {};
    if (!text || !target) throw new Error("text dan target wajib diisi");
    const result = await googleTranslate(text, target, source);
    res.json(success(result, { ping: `${Date.now() - started}ms` }));
  } catch (err) {
    res.status(500).json(failure(err.message));
  }
});

app.all("/api/shortlink/create", async (req, res) => {
  try {
    const input = pickInput(req);
    const result = createShortlink(input.url || input.link, input.code || input.custom);
    const base = `${req.protocol}://${req.get("host")}`;
    res.json(success({ ...result, shortUrl: `${base}/s/${result.code}` }));
  } catch (err) {
    res.status(400).json(failure(err.message, 400));
  }
});

app.get("/s/:code", (req, res) => {
  try {
    const entry = resolveShortlink(req.params.code);
    res.redirect(302, entry.url);
  } catch (err) {
    res.status(404).json(failure(err.message, 404));
  }
});

app.all("/api/:appName/:action", async (req, res) => {
  const started = Date.now();
  const { appName, action } = req.params;
  const input = pickInput(req);

  const category = REGISTRY[appName];
  if (!category) {
    return res.status(404).json(failure(`App "${appName}" tidak ditemukan di registry`, 404));
  }

  const providers = category[action];
  if (!providers || !Array.isArray(providers)) {
    return res.status(404).json(failure(
      `Action "${action}" tidak tersedia untuk "${appName}". Tersedia: ${Object.keys(category).filter(k => k !== "label").join(", ")}`,
      404
    ));
  }

  const url = input.url || input.link || "";
  const query = input.q || input.query || input.keyword || url;
  const args = url || query ? [url || query, input] : [input];

  try {
    const { result, provider, tried } = await runFallback(providers, args);
    res.json(success(result, {
      engine: provider,
      app: appName,
      action,
      ping: `${Date.now() - started}ms`,
      fallback_attempts: tried.length
    }));
  } catch (err) {
    res.status(502).json(Object.assign(
      failure(err.message, 502),
      { app: appName, action, tried: err.tried || [], ping: `${Date.now() - started}ms` }
    ));
  }
});

app.get("/cdn/download", streamDownload);

app.get("/health", (req, res) => {
  res.json({ status: "ok", ...META, time: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json(failure("Endpoint tidak ditemukan", 404));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(failure(err.message || "Internal Server Error", 500));
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`[machine-api] berjalan di port ${PORT}`);
  });
  server.timeout = REQUEST_TIMEOUT_MS;
  server.keepAliveTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = REQUEST_TIMEOUT_MS + 1000;
}

module.exports = app;
