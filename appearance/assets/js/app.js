const App = {
  root: null,

  async init() {
    THEME.init();
    this.root = document.getElementById("app-content");
    this.buildTopbar();
    this.buildSidebar();
    this.bindGlobalEvents();

    const langFromUrl = location.pathname.split("/")[2];
    const savedLang = localStorage.getItem("machineapi_lang");
    const browserLang = (navigator.language || "en").slice(0, 2);
    const initialLang = langFromUrl || savedLang || browserLang || "id";

    await I18N.load(initialLang);
    localStorage.setItem("machineapi_lang", I18N.current);

    window.addEventListener("popstate", () => this.route());
    this.route();
  },

  navigate(path) {
    history.pushState({}, "", path);
    this.route();
  },

  route() {
    const parts = location.pathname.split("/").filter(Boolean);
    let page = parts[1] || "home";
    const appParam = new URLSearchParams(location.search).get("app");

    document.querySelectorAll(".sidebar-link").forEach((l) => {
      l.classList.toggle("active", l.dataset.page === page || l.dataset.app === appParam);
    });

    if (page === "home") return Pages.renderHome(this.root);
    if (page === "ai") return Pages.renderAI(this.root);
    if (page === "shortlink") return Pages.renderShortlink(this.root);
    if (page === "docs") return Pages.renderDocs(this.root);
    if (page === "downloader" && appParam) return Pages.renderDownloader(this.root, appParam);

    return Pages.renderHome(this.root);
  },

  buildTopbar() {
    const topbar = document.getElementById("topbar");
    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="hamburger-btn" id="hamburgerBtn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <a href="/" class="brand" id="brandLink">
          <span class="brand-dot"></span>
          <span>Machine API</span>
        </a>
      </div>
      <div class="topbar-right">
        <div class="dropdown-wrap" id="themeDropdown">
          <button class="icon-btn" id="themeBtn">🎨</button>
          <div class="dropdown-panel">
            <div class="dropdown-item" data-theme-choice="light"><span class="emoji">☀️</span> <span data-i18n="theme_light">Light</span></div>
            <div class="dropdown-item" data-theme-choice="dark"><span class="emoji">🌙</span> <span data-i18n="theme_dark">Dark</span></div>
            <div class="dropdown-item" data-theme-choice="system"><span class="emoji">🖥️</span> <span data-i18n="theme_system">System</span></div>
          </div>
        </div>
        <div class="dropdown-wrap" id="langDropdown">
          <button class="icon-btn" id="langBtn">🌐</button>
          <div class="dropdown-panel" id="langPanel"></div>
        </div>
      </div>
    `;

    document.getElementById("brandLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.navigate(`/home/${I18N.current}`);
    });

    const langPanel = document.getElementById("langPanel");
    langPanel.innerHTML = `<div class="dropdown-section-label">Pilih Bahasa</div>` +
      SUPPORTED_LANGS.map((l) => `<div class="dropdown-item" data-lang-choice="${l.code}"><span class="emoji">${l.flag}</span> <span>${l.code.toUpperCase()}</span></div>`).join("");

    this.toggleDropdown("themeDropdown", "themeBtn");
    this.toggleDropdown("langDropdown", "langBtn");

    document.querySelectorAll("[data-theme-choice]").forEach((item) => {
      item.addEventListener("click", () => {
        THEME.set(item.dataset.themeChoice);
        document.getElementById("themeDropdown").classList.remove("open");
        Utils.toast("🎨 Tema diperbarui");
      });
    });

    document.querySelectorAll("[data-lang-choice]").forEach((item) => {
      item.addEventListener("click", async () => {
        const code = item.dataset.langChoice;
        await I18N.load(code);
        localStorage.setItem("machineapi_lang", code);
        document.getElementById("langDropdown").classList.remove("open");
        const parts = location.pathname.split("/").filter(Boolean);
        if (parts[0] === "home") {
          this.navigate(`/home/${code}`);
        }
        Utils.toast("🌐 Bahasa diperbarui");
      });
    });
  },

  toggleDropdown(wrapId, btnId) {
    const wrap = document.getElementById(wrapId);
    const btn = document.getElementById(btnId);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains("open");
      document.querySelectorAll(".dropdown-wrap.open").forEach((w) => w.classList.remove("open"));
      if (!isOpen) wrap.classList.add("open");
    });
  },

  buildSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    let html = `
      <div class="sidebar-header">
        <div class="brand"><span class="brand-dot"></span><span>Machine API</span></div>
        <button class="icon-btn" id="closeSidebarBtn">✕</button>
      </div>
    `;

    html += `<div class="sidebar-group-label">Menu</div>`;
    for (const p of SPECIAL_PAGES) {
      html += `<a href="#" class="sidebar-link" data-page="${p.key}"><span class="ic emoji">${p.icon}</span><span data-i18n="${p.label}">${p.label}</span></a>`;
    }

    html += `<div class="sidebar-group-label">Kategori Layanan</div>`;
    for (const c of CATEGORIES) {
      html += `<a href="#" class="sidebar-link" data-app="${c.key}"><span class="ic emoji">${c.icon}</span><span>${c.label}</span></a>`;
    }

    sidebar.innerHTML = html;

    document.getElementById("hamburgerBtn").addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("open");
    });
    document.getElementById("closeSidebarBtn").addEventListener("click", () => this.closeSidebar());
    overlay.addEventListener("click", () => this.closeSidebar());

    sidebar.querySelectorAll("[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeSidebar();
        this.navigate(`/${link.dataset.page}/${I18N.current}`);
      });
    });
    sidebar.querySelectorAll("[data-app]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeSidebar();
        this.navigate(`/downloader/${I18N.current}?app=${link.dataset.app}`);
      });
    });
  },

  closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("open");
  },

  bindGlobalEvents() {
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown-wrap.open").forEach((w) => w.classList.remove("open"));
    });
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
