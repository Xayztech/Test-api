const HISTORY_STORE = {
  KEY: "machineapi_history_v1",
  MAX_AGE_MS: 365 * 24 * 60 * 60 * 1000,

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const now = Date.now();
      return parsed.filter((item) => now - item.ts < this.MAX_AGE_MS);
    } catch {
      return [];
    }
  },

  _write(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    document.cookie = `machineapi_has_history=1; max-age=${Math.floor(this.MAX_AGE_MS / 1000)}; path=/; SameSite=Lax`;
  },

  add(entry) {
    const items = this._read();
    items.unshift({ ...entry, ts: Date.now() });
    this._write(items.slice(0, 200));
  },

  all() {
    return this._read();
  },

  clear() {
    localStorage.removeItem(this.KEY);
  }
};
