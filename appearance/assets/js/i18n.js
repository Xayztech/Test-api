const SUPPORTED_LANGS = [
  { code: "id", flag: "🇮🇩" }, { code: "en", flag: "🇬🇧" }, { code: "es", flag: "🇪🇸" },
  { code: "fr", flag: "🇫🇷" }, { code: "de", flag: "🇩🇪" }, { code: "pt", flag: "🇵🇹" },
  { code: "it", flag: "🇮🇹" }, { code: "ja", flag: "🇯🇵" }, { code: "ko", flag: "🇰🇷" },
  { code: "zh", flag: "🇨🇳" }, { code: "ar", flag: "🇸🇦" }, { code: "ru", flag: "🇷🇺" },
  { code: "hi", flag: "🇮🇳" }, { code: "tr", flag: "🇹🇷" }, { code: "vi", flag: "🇻🇳" },
  { code: "th", flag: "🇹🇭" }, { code: "nl", flag: "🇳🇱" }, { code: "ms", flag: "🇲🇾" }
];

const I18N = {
  cache: {},
  current: "id",
  dict: {},

  async load(langCode) {
    if (this.cache[langCode]) {
      this.dict = this.cache[langCode];
      this.current = langCode;
      this.apply();
      return;
    }

    const known = SUPPORTED_LANGS.some((l) => l.code === langCode);
    if (known) {
      try {
        const res = await fetch(`/assets/i18n/${langCode}.json`);
        const data = await res.json();
        this.cache[langCode] = data;
        this.dict = data;
        this.current = langCode;
        this.apply();
        return;
      } catch (e) {
        console.warn("i18n load failed, falling back to en", e);
      }
    } else {
      const translated = await this.autoTranslate(langCode);
      if (translated) {
        this.cache[langCode] = translated;
        this.dict = translated;
        this.current = langCode;
        this.apply();
        return;
      }
    }

    if (langCode !== "en") return this.load("en");
  },

  async autoTranslate(langCode) {
    try {
      const base = this.cache["en"] || (await (await fetch("/assets/i18n/en.json")).json());
      this.cache["en"] = base;
      const keys = Object.keys(base);
      const text = keys.map((k) => base[k]).join("\n|||\n");
      const res = await fetch(`/api/translate?target=${encodeURIComponent(langCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const json = await res.json();
      if (!json.status) return null;
      const parts = json.result.translated.split("\n|||\n");
      const out = {};
      keys.forEach((k, i) => { out[k] = parts[i] || base[k]; });
      return out;
    } catch (e) {
      console.warn("autoTranslate failed", e);
      return null;
    }
  },

  t(key) {
    return (this.dict && this.dict[key]) || key;
  },

  apply() {
    document.documentElement.lang = this.current;
    document.documentElement.dir = this.current === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = this.t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", this.t(key));
    });
    window.dispatchEvent(new CustomEvent("i18n:changed"));
  }
};
