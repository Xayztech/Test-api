async function runFallback(providers, args, opts) {
  opts = opts || {};
  const tried = [];
  let lastError = null;

  for (const p of providers) {
    const started = Date.now();
    try {
      const result = await p.fn(...args);
      tried.push({ provider: p.name, ok: true, ms: Date.now() - started });
      return { result, provider: p.name, tried };
    } catch (err) {
      tried.push({ provider: p.name, ok: false, ms: Date.now() - started, error: err && err.message });
      lastError = err;
      if (opts.stopOnFirstError) break;
    }
  }

  const err = new Error(
    (lastError && lastError.message) || "Semua provider fallback gagal"
  );
  err.tried = tried;
  throw err;
}

module.exports = { runFallback };
