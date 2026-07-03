class KeyRotator {
  constructor(keys) {
    this.keys = (keys || []).filter(Boolean);
    this.index = 0;
  }

  hasKeys() {
    return this.keys.length > 0;
  }

  current() {
    if (!this.hasKeys()) return null;
    return this.keys[this.index % this.keys.length];
  }

  rotate() {
    if (!this.hasKeys()) return null;
    this.index = (this.index + 1) % this.keys.length;
    return this.current();
  }

  async run(taskFn) {
    if (!this.hasKeys()) {
      throw new Error("Tidak ada API key yang dikonfigurasi.");
    }
    let lastErr = null;
    const total = this.keys.length;
    for (let attempt = 0; attempt < total; attempt++) {
      const key = this.current();
      try {
        return await taskFn(key);
      } catch (err) {
        lastErr = err;
        this.rotate();
      }
    }
    throw lastErr || new Error("Semua API key gagal digunakan.");
  }
}

module.exports = { KeyRotator };
