Pages.renderDownloader = function (root, appKey) {
  const cat = CATEGORIES.find((c) => c.key === appKey);
  if (!cat) {
    root.innerHTML = `<div class="panel">App tidak ditemukan.</div>`;
    return;
  }

  const hasSearch = cat.actions.includes("search");
  const hasDownload = cat.actions.includes("download");
  const primaryAction = hasSearch && hasDownload ? "search" : cat.actions[0];

  root.innerHTML = `
    <section class="hero fade-in">
      <h1><span class="emoji">${cat.icon}</span> ${cat.label}</h1>
      <p>Tempel link ${cat.label} atau kata kunci, sistem akan otomatis mendeteksi dan memproses menggunakan mesin terbaik yang tersedia.</p>
    </section>

    <div class="panel fade-in">
      <input type="text" class="input" id="dlInput" data-i18n-placeholder="search_placeholder" placeholder="Tempel link atau kata kunci..." />

      <div class="tabs" id="dlTabs">
        ${hasSearch ? `<button class="tab-btn ${primaryAction === "search" ? "active" : ""}" data-tab="search" data-i18n="tab_search">Pencarian</button>` : ""}
        ${hasDownload ? `<button class="tab-btn ${primaryAction === "download" ? "active" : ""}" data-tab="download" data-i18n="tab_download">Unduh</button>` : ""}
        ${hasSearch && hasDownload ? `<button class="tab-btn" data-tab="searchdownload" data-i18n="tab_search_download">Cari + Unduh</button>` : ""}
        ${!hasSearch && !hasDownload ? cat.actions.map((a) => `<button class="tab-btn" data-tab="${a}">${a}</button>`).join("") : ""}
      </div>

      <button class="btn btn-primary" id="dlRunBtn" style="width:100%;">⚡ Proses Sekarang</button>

      <div id="dlOutput"></div>
    </div>
  `;
  I18N.apply();

  let activeTab = document.querySelector("#dlTabs .tab-btn.active")?.dataset.tab || cat.actions[0];

  document.querySelectorAll("#dlTabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#dlTabs .tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
    });
  });

  document.getElementById("dlRunBtn").addEventListener("click", () => runDownloaderAction(appKey, activeTab));
  document.getElementById("dlInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runDownloaderAction(appKey, activeTab);
  });
};

async function runDownloaderAction(appKey, tab) {
  const input = document.getElementById("dlInput").value.trim();
  const output = document.getElementById("dlOutput");
  const btn = document.getElementById("dlRunBtn");
  if (!input) return Utils.toast("⚠️ Isi link atau kata kunci dulu");

  btn.disabled = true;
  const originalLabel = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;
  output.innerHTML = `
    <div class="loading-row fade-in">
      <span class="spinner"></span>
      <span>Menjalankan mesin fallback terbaik untuk ${appKey}...</span>
    </div>
    <div class="skeleton" style="height:120px;margin-top:10px;"></div>
  `;

  const action = tab === "searchdownload" ? "search" : tab;
  const isUrl = /^https?:\/\//i.test(input);
  const params = new URLSearchParams(isUrl ? { url: input } : { q: input });

  const { json } = await Utils.apiCall(`/api/${appKey}/${action}?${params.toString()}`);

  btn.disabled = false;
  btn.innerHTML = originalLabel;

  HISTORY_STORE.add({ app: appKey, action, input, ok: json.status });

  if (!json.status) {
    output.innerHTML = `
      <div class="panel fade-in" style="border-color:var(--danger);">
        <strong style="color:var(--danger);">❌ ${json.error}</strong>
        <p style="color:var(--text-muted); margin-top:6px;">Semua mesin fallback gagal. Coba link/kata kunci lain, atau cek Raw JSON di bawah untuk detail percobaan setiap provider.</p>
      </div>
      ${renderJsonViewer(json)}
    `;
    return;
  }

  if (tab === "searchdownload") {
    renderSearchResults(output, appKey, json, true);
  } else if (action === "search") {
    renderSearchResults(output, appKey, json, false);
  } else {
    renderMediaResult(output, appKey, json);
  }
}

function renderJsonViewer(json) {
  const raw = JSON.stringify(json, null, 2);
  const id = "json_" + Math.random().toString(36).slice(2, 8);
  return `
    <div class="json-viewer fade-in" id="${id}">${Utils.syntaxHighlightJSON(json)}</div>
    <div class="json-actions">
      <button class="btn btn-sm" data-copy-json="${id}" data-i18n="copy">📋 Salin</button>
      <button class="btn btn-sm" data-open-json="${id}" data-i18n="open_redirect">↗️ Buka Redirect</button>
    </div>
  `;
}

function bindJsonViewerActions(container, jsonData) {
  container.querySelectorAll("[data-copy-json]").forEach((btn) => {
    btn.addEventListener("click", () => Utils.copy(JSON.stringify(jsonData, null, 2)));
  });
  container.querySelectorAll("[data-open-json]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      window.open(URL.createObjectURL(blob), "_blank");
    });
  });
}

function renderSearchResults(output, appKey, json, scrollToOnline) {
  const items = Array.isArray(json.result) ? json.result : (json.result?.items || json.result?.results || [json.result]);
  let html = `<div class="grid fade-in" id="searchResultsGrid"></div>${renderJsonViewer(json)}`;
  output.innerHTML = html;

  const grid = document.getElementById("searchResultsGrid");
  items.filter(Boolean).forEach((item, idx) => {
    const title = item.title || item.name || item.text || `Hasil #${idx + 1}`;
    const thumb = item.thumbnail || item.image || item.thumb || item.cover || "";
    const url = item.url || item.link || item.webpage_url || "";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${thumb ? `<div class="media-thumb" style="width:100%;margin-bottom:10px;"><img src="${thumb}" loading="lazy" /></div>` : ""}
      <h3>${title}</h3>
      <p>${item.duration || item.author || item.channel || ""}</p>
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        ${url ? `<button class="btn btn-sm" data-copy-link="${url}">📋 Copy Link</button>` : ""}
        ${url ? `<a class="btn btn-sm" href="${url}" target="_blank" rel="noopener">🔗 Open</a>` : ""}
        ${scrollToOnline && url ? `<button class="btn btn-sm btn-primary" data-online-dl="${url}">🎯 Content Online + Download</button>` : ""}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-copy-link]").forEach((b) => b.addEventListener("click", () => Utils.copy(b.dataset.copyLink)));
  grid.querySelectorAll("[data-online-dl]").forEach((b) => {
    b.addEventListener("click", async () => {
      document.getElementById("dlInput").value = b.dataset.onlineDl;
      await runDownloaderAction(appKey, "download");
      document.getElementById("dlOutput").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  bindJsonViewerActions(output, json);
}

function pickMediaUrl(result, kind) {
  if (!result) return null;
  const candidates = kind === "audio"
    ? [result.audio, result.mp3, result.audioUrl, result.audio_url]
    : [result.video, result.mp4, result.videoUrl, result.video_url, result.url, result.download];
  for (const c of candidates) {
    if (typeof c === "string") return c;
    if (c && typeof c === "object" && c.url) return c.url;
  }
  if (Array.isArray(result.formats)) {
    const match = result.formats.find((f) => kind === "audio" ? f.mimeType?.includes("audio") : f.mimeType?.includes("video"));
    if (match) return match.url;
  }
  return null;
}

function renderMediaResult(output, appKey, json) {
  const r = json.result || {};
  const title = r.title || r.name || "Media";
  const thumb = r.thumbnail || r.cover || r.image || "";
  const author = r.author || r.artist || r.channel || r.uploader || "-";
  const duration = r.duration || r.length || "-";
  const desc = r.description || "";
  const country = r.country || r.region || "";
  const likes = r.like_count || r.likes || "-";
  const comments = r.comment_count || r.comments || "-";

  const videoUrl = pickMediaUrl(r, "video");
  const audioUrl = pickMediaUrl(r, "audio");

  output.innerHTML = `
    <div class="fade-in">
      <div class="media-meta">
        ${thumb ? `<div class="media-thumb"><img src="${thumb}" /></div>` : ""}
        <div class="media-info">
          <h2>${title}</h2>
          <div class="meta-tags">
            <span class="meta-tag">👤 ${author}</span>
            <span class="meta-tag">⏱️ ${duration}</span>
            <span class="meta-tag">👍 ${likes}</span>
            <span class="meta-tag">💬 ${comments}</span>
            ${country ? `<span class="meta-tag">🌍 ${country}</span>` : ""}
          </div>
          ${desc ? `<p style="color:var(--text-muted); margin-top:10px; font-size:13.5px;">${String(desc).slice(0, 260)}${desc.length > 260 ? "…" : ""}</p>` : ""}
        </div>
      </div>

      <div class="player" id="playerBox"></div>

      <div class="panel" style="margin-top:16px;">
        <h3 style="margin-top:0;">⬇️ Pilih Format Unduhan</h3>
        <div class="tabs" id="formatTabs">
          ${videoUrl ? `<button class="tab-btn active" data-fmt="mp4">🎞️ MP4</button>` : ""}
          ${audioUrl ? `<button class="tab-btn ${videoUrl ? "" : "active"}" data-fmt="mp3">🎵 Audio / MP3</button>` : ""}
        </div>
        <div id="formatOptions"></div>
        <a class="btn btn-primary" id="finalDownloadBtn" style="margin-top:14px;">⬇️ Download Sekarang</a>
      </div>

      ${renderJsonViewer(json)}
    </div>
  `;
  bindJsonViewerActions(output, json);

  const mediaUrl = videoUrl || audioUrl;
  if (mediaUrl) buildPlayer(document.getElementById("playerBox"), mediaUrl, videoUrl ? "video" : "audio");

  const qualityMap = {
    mp4: ["320p", "480p", "720p", "1080p"],
    mp3: ["128kbps", "320kbps"]
  };

  let currentFmt = videoUrl ? "mp4" : "mp3";

  function renderFormatOptions() {
    const opts = document.getElementById("formatOptions");
    opts.innerHTML = qualityMap[currentFmt].map((q, i) =>
      `<button class="tab-btn ${i === (currentFmt === "mp4" ? 0 : 1) ? "active" : ""}" data-quality="${q}">${q}</button>`
    ).join("");
    opts.querySelectorAll("[data-quality]").forEach((b) => {
      b.addEventListener("click", () => {
        opts.querySelectorAll("[data-quality]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        updateDownloadLink();
      });
    });
    updateDownloadLink();
  }

  function updateDownloadLink() {
    const finalBtn = document.getElementById("finalDownloadBtn");
    const url = currentFmt === "mp4" ? videoUrl : audioUrl;
    const params = new URLSearchParams({
      url,
      type: currentFmt === "mp3" ? "mp3" : (currentFmt === "mp4" ? "video" : "audio"),
      filename: (title || "machineapi").slice(0, 60),
      title,
      artist: author,
      thumbnail: thumb || ""
    });
    finalBtn.href = `/cdn/download?${params.toString()}`;
  }

  document.querySelectorAll("#formatTabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#formatTabs .tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFmt = btn.dataset.fmt;
      renderFormatOptions();
    });
  });

  renderFormatOptions();
}

function buildPlayer(container, src, kind) {
  const mediaEl = kind === "video"
    ? Utils.el("video", { src, style: "width:100%;border-radius:10px;background:#000;max-height:360px;", playsinline: "" })
    : Utils.el("audio", { src, style: "display:none;" });

  container.appendChild(mediaEl);

  const seek = Utils.el("input", { type: "range", class: "player-seek", min: "0", max: "100", value: "0" });
  const timeRow = Utils.el("div", { class: "player-time" }, [
    Utils.el("span", { id: "curTime" }, "00:00"),
    Utils.el("span", { id: "durTime" }, "00:00")
  ]);
  container.appendChild(seek);
  container.appendChild(timeRow);

  const controls = Utils.el("div", { class: "player-controls" });
  const btnMinus10 = Utils.el("button", { onclick: () => (mediaEl.currentTime -= 10) }, "⏪10");
  const btnMinus5 = Utils.el("button", { onclick: () => (mediaEl.currentTime -= 5) }, "⏪5");
  const btnPlay = Utils.el("button", { class: "play-pause", id: "playPauseBtn" }, "▶️");
  const btnStop = Utils.el("button", { onclick: () => { mediaEl.pause(); mediaEl.currentTime = 0; } }, "⏹️");
  const btnPlus5 = Utils.el("button", { onclick: () => (mediaEl.currentTime += 5) }, "5⏩");
  const btnPlus10 = Utils.el("button", { onclick: () => (mediaEl.currentTime += 10) }, "10⏩");
  [btnMinus10, btnMinus5, btnPlay, btnStop, btnPlus5, btnPlus10].forEach((b) => controls.appendChild(b));
  container.appendChild(controls);

  btnPlay.addEventListener("click", () => {
    if (mediaEl.paused) mediaEl.play(); else mediaEl.pause();
  });
  mediaEl.addEventListener("play", () => (btnPlay.textContent = "⏸️"));
  mediaEl.addEventListener("pause", () => (btnPlay.textContent = "▶️"));

  mediaEl.addEventListener("loadedmetadata", () => {
    seek.max = mediaEl.duration || 100;
    document.getElementById("durTime").textContent = Utils.formatTime(mediaEl.duration);
  });
  mediaEl.addEventListener("timeupdate", () => {
    seek.value = mediaEl.currentTime;
    document.getElementById("curTime").textContent = Utils.formatTime(mediaEl.currentTime);
  });
  seek.addEventListener("input", () => { mediaEl.currentTime = seek.value; });

  const volRow = Utils.el("div", { class: "volume-row" });
  const volIcon = Utils.el("span", { class: "emoji" }, "🔊");
  const volSlider = Utils.el("input", { type: "range", min: "0", max: "500", value: "100" });
  const volLabel = Utils.el("span", { class: "volume-label" }, "100%");
  volRow.appendChild(volIcon); volRow.appendChild(volSlider); volRow.appendChild(volLabel);
  container.appendChild(volRow);

  let audioCtx, gainNode, sourceNode;
  function ensureBoostGraph() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaElementSource(mediaEl);
    gainNode = audioCtx.createGain();
    sourceNode.connect(gainNode).connect(audioCtx.destination);
  }

  volSlider.addEventListener("input", () => {
    const val = Number(volSlider.value);
    volLabel.textContent = `${val}%`;
    if (val <= 100) {
      mediaEl.volume = val / 100;
      if (gainNode) gainNode.gain.value = 1;
    } else {
      mediaEl.volume = 1;
      ensureBoostGraph();
      if (audioCtx.state === "suspended") audioCtx.resume();
      gainNode.gain.value = val / 100;
    }
  });
}
