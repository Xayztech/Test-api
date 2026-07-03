const Pages = {};

Pages.renderHome = function (root) {
  root.innerHTML = `
    <section class="hero fade-in">
      <h1 data-i18n="hero_title">Machine API</h1>
      <p data-i18n="hero_desc"></p>
    </section>
    <div class="grid" id="homeGrid"></div>
  `;
  I18N.apply();

  const grid = document.getElementById("homeGrid");
  for (const c of CATEGORIES) {
    const card = Utils.el("a", {
      href: "#",
      class: "card fade-in",
      onclick: (e) => {
        e.preventDefault();
        App.navigate(`/downloader/${I18N.current}?app=${c.key}`);
      }
    }, [
      Utils.el("span", { class: "ic emoji" }, c.icon),
      Utils.el("h3", {}, c.label),
      Utils.el("p", {}, `${c.actions.length} aksi tersedia \u2022 fallback otomatis`)
    ]);
    grid.appendChild(card);
  }
};

Pages.renderShortlink = function (root) {
  root.innerHTML = `
    <section class="hero fade-in">
      <h1>🔗 Shortlink Generator</h1>
      <p>Persingkat URL apa pun secara instan. Klik hasilnya untuk menyalin.</p>
    </section>
    <div class="panel fade-in">
      <input type="url" class="input" id="slUrl" placeholder="https://contoh.com/link/sangat/panjang" />
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <input type="text" class="input" id="slCustom" placeholder="(opsional) kode custom" style="max-width:220px;" />
        <button class="btn btn-primary" id="slCreateBtn">⚡ Buat Shortlink</button>
      </div>
      <div id="slResult"></div>
    </div>
  `;

  document.getElementById("slCreateBtn").addEventListener("click", async () => {
    const url = document.getElementById("slUrl").value.trim();
    const code = document.getElementById("slCustom").value.trim();
    const btn = document.getElementById("slCreateBtn");
    if (!url) return Utils.toast("⚠️ Masukkan URL dulu");

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Memproses...`;

    const { json } = await Utils.apiCall("/api/shortlink/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, code })
    });

    btn.disabled = false;
    btn.innerHTML = "⚡ Buat Shortlink";

    const resultBox = document.getElementById("slResult");
    if (!json.status) {
      resultBox.innerHTML = `<p style="color:var(--danger)">❌ ${json.error}</p>`;
      return;
    }

    resultBox.innerHTML = `
      <div class="panel fade-in" style="cursor:pointer" id="slLinkBox">
        <strong style="font-size:16px;">${json.result.shortUrl}</strong>
        <p style="color:var(--text-muted); margin:6px 0 0;">Klik untuk menyalin</p>
      </div>
      <div class="json-viewer">${Utils.syntaxHighlightJSON(json)}</div>
      <div class="json-actions">
        <button class="btn btn-sm" id="slCopyJson">📋 Salin JSON</button>
      </div>
    `;
    document.getElementById("slLinkBox").addEventListener("click", () => Utils.copy(json.result.shortUrl));
    document.getElementById("slCopyJson").addEventListener("click", () => Utils.copy(JSON.stringify(json, null, 2)));
  });
};

Pages.renderDocs = function (root) {
  root.innerHTML = `
    <section class="hero fade-in">
      <h1>📚 Dokumentasi API</h1>
      <p>Panduan lengkap penggunaan Machine API sebagai REST API maupun langsung dari dashboard.</p>
    </section>

    <div class="panel fade-in">
      <h2>🚀 Quick Start</h2>
      <p>Semua endpoint mengikuti pola berikut dan menerima <strong>semua metode HTTP</strong> (GET, POST, PUT, DELETE, dll):</p>
      <pre><code>/api/{app}/{action}?url=...
/api/{app}/{action}?q=...</code></pre>
      <p>Contoh nyata:</p>
      <pre><code>GET /api/yt/search?q=lofi+beats
GET /api/yt/download?url=https://youtu.be/xxxxxxx
GET /api/tiktok/download?url=https://vt.tiktok.com/xxxx
POST /api/ai/chat  { "message": "Halo!" }</code></pre>

      <h2>📦 Format Response</h2>
      <pre><code>{
  "status": true,
  "code": 200,
  "creator": "XYCoolcraft",
  "developer": "XYCoolcraft",
  "version": "v1.0.0",
  "result": { ... },
  "engine": "nama-provider-yang-berhasil",
  "ping": "123ms",
  "time": "2026-07-04T12:00:00.000Z"
}</code></pre>

      <h2>❌ Format Error</h2>
      <pre><code>{
  "status": false,
  "code": 502,
  "creator": "XYCoolcraft",
  "developer": "XYCoolcraft",
  "version": "v1.0.0",
  "error": "Semua provider fallback gagal",
  "tried": [
    { "provider": "provider-a", "ok": false, "ms": 120, "error": "Timeout" },
    { "provider": "provider-b", "ok": false, "ms": 80, "error": "403 Forbidden" }
  ],
  "time": "2026-07-04T12:00:00.000Z"
}</code></pre>

      <h2>📋 Daftar Kode Status</h2>
      <table class="docs-table">
        <tr><th>Kode</th><th>Arti</th></tr>
        <tr><td>200</td><td>Berhasil</td></tr>
        <tr><td>400</td><td>Request tidak valid (parameter kurang/salah)</td></tr>
        <tr><td>404</td><td>App atau action tidak ditemukan di registry</td></tr>
        <tr><td>500</td><td>Kesalahan internal server</td></tr>
        <tr><td>502</td><td>Semua provider fallback gagal memproses request</td></tr>
      </table>

      <h2>🗂️ Kategori & Aksi Tersedia</h2>
      <table class="docs-table" id="docsCategoryTable">
        <tr><th>App</th><th>Aksi</th></tr>
      </table>

      <h2>🧠 AI Chat</h2>
      <p>Endpoint: <code>POST /api/ai/chat</code></p>
      <pre><code>{
  "message": "Jelaskan relativitas umum",
  "history": [
    { "role": "user", "text": "Halo" },
    { "role": "assistant", "text": "Halo juga!" }
  ],
  "files": [
    { "mimeType": "image/png", "base64": "..." }
  ]
}</code></pre>

      <h2>🔗 Shortlink</h2>
      <pre><code>POST /api/shortlink/create  { "url": "https://...", "code": "opsional" }
GET  /s/{code}   -&gt; redirect otomatis</code></pre>

      <h2>🌐 Auto-Detect Platform</h2>
      <pre><code>GET /api/detect?url=https://youtu.be/xxxx
-&gt; { "detected": true, "app": "yt", "label": "YouTube" }</code></pre>

      <h2>🈯 Terjemahan</h2>
      <pre><code>POST /api/translate  { "text": "Halo dunia", "target": "en" }</code></pre>

      <h2>⚠️ Catatan Deploy</h2>
      <p>Untuk hosting serverless gratis (mis. Vercel Hobby), fungsi memiliki batas eksekusi. Endpoint yang memproses media besar (upscale, video panjang) sebaiknya dijalankan di VPS menggunakan <code>deploy.sh</code> yang disertakan, karena mendukung timeout hingga 48 jam. Vercel akan tetap berjalan untuk endpoint ringan (search, shortlink, translate, AI chat teks).</p>
    </div>
  `;

  const table = document.getElementById("docsCategoryTable");
  for (const c of CATEGORIES) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${c.key}</td><td>${c.actions.join(", ")}</td>`;
    table.appendChild(row);
  }
};
