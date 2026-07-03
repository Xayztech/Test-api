const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const OBFUSCATE_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.6,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  transformObjectKeys: false
};

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (path.basename(src) === "node_modules" || path.basename(src) === "dist" || path.basename(src) === "data") return;
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function obfuscateJsFilesIn(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      obfuscateJsFilesIn(full);
      continue;
    }
    if (item.endsWith(".js")) {
      const code = fs.readFileSync(full, "utf-8");
      try {
        const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATE_OPTIONS);
        fs.writeFileSync(full, result.getObfuscatedCode());
        console.log(`[protect] obfuscated: ${path.relative(ROOT, full)}`);
      } catch (err) {
        console.warn(`[protect] gagal obfuscate ${full}: ${err.message}`);
      }
    }
  }
}

function main() {
  console.log("[protect] Membersihkan folder dist/ sebelumnya...");
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log("[protect] Menyalin source ke dist/...");
  for (const item of ["machine-api", "appearance", "package.json", "vercel.json"]) {
    copyRecursive(path.join(ROOT, item), path.join(DIST, item));
  }

  console.log("[protect] Meng-obfuscate backend (machine-api)...");
  obfuscateJsFilesIn(path.join(DIST, "machine-api"));

  console.log("[protect] Meng-obfuscate frontend (appearance/assets/js)...");
  obfuscateJsFilesIn(path.join(DIST, "appearance", "assets", "js"));

  console.log("\n[protect] Selesai. Deploy folder 'dist/' ini ke production,");
  console.log("          simpan folder asli untuk development selanjutnya.");
}

main();
