const THEME = {
  KEY: "machineapi_theme",

  init() {
    const saved = localStorage.getItem(this.KEY) || "system";
    this.set(saved, false);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if ((localStorage.getItem(this.KEY) || "system") === "system") this.applySystem();
    });
  },

  set(mode, persist = true) {
    if (persist) localStorage.setItem(this.KEY, mode);
    if (mode === "system") {
      this.applySystem();
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }
  },

  applySystem() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  },

  current() {
    return localStorage.getItem(this.KEY) || "system";
  }
};
