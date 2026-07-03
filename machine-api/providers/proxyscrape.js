import fs from 'node:fs';
import path from 'node:path';

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROTOCOLS = ["http", "https", "socks4", "socks5"];

function parseProtocols(input) {
  if (!input || input === "all") return PROTOCOLS;
  const selected = input.toLowerCase().split(",").map(s => s.trim()).filter(s => PROTOCOLS.includes(s));
  return selected.length > 0 ? selected : PROTOCOLS;
}

function statusLabel(speed) {
  if (!speed || speed === 0) return "unknown";
  if (speed < 400) return "fastest";
  if (speed < 800) return "fast";
  if (speed < 2000) return "medium";
  if (speed < 4000) return "slow";
  return "very-slow";
}

async function fetchProxyscrape(protocols) {
  const all = [];
  for (const proto of protocols) {
    try {
      const r = await fetch(`https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json&protocol=${proto}`, {
        headers: { "User-Agent": pick(UAS) },
        signal: AbortSignal.timeout(15000)
      });
      if (!r.ok) continue;
      const data = await r.json();
      for (const p of (data.proxies || [])) {
        if (p.alive && p.ip && p.port && p.port > 0 && p.port < 65536) {
          const speed = p.timeout || p.average_timeout || 0;
          const country = p.country || p.ip_data?.country || p.ip_data?.countryCode || "";
          all.push({
            ip: p.ip, port: p.port, protocol: proto,
            country, anonymity: p.anonymity || "unknown",
            speed: Math.round(speed), status: p.alive ? "alive" : "dead",
            url: `${proto}://${p.ip}:${p.port}`, source: "ProxyScrape"
          });
        }
      }
      await sleep(300);
    } catch (e) {}
  }
  return all.slice(0, 400);
}

async function fetchPubproxy(protocols) {
  const all = [];
  for (const proto of protocols) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(`http://pubproxy.com/api/proxy?format=json&type=${proto}&limit=20`, {
          headers: { "User-Agent": pick(UAS) },
          signal: AbortSignal.timeout(10000)
        });
        if (!r.ok) continue;
        const data = await r.json();
        for (const p of (data.data || [])) {
          const port = parseInt(p.port) || 0;
          if (p.ip && port > 0 && port < 65536) {
            const speed = parseInt(p.speed) || 0;
            all.push({
              ip: p.ip, port, protocol: proto,
              country: p.country || "", anonymity: p.proxy_level || "unknown",
              speed, status: speed > 0 && speed < 10000 ? "alive" : "unknown",
              url: `${proto}://${p.ip}:${port}`, source: "PubProxy"
            });
          }
        }
        await sleep(500);
      } catch (e) {}
    }
  }
  return all;
}

async function fetchProxyListDownload(protocols) {
  const all = [];
  for (const proto of protocols) {
    try {
      const r = await fetch(`https://www.proxy-list.download/api/v1/get?type=${proto}`, {
        headers: { "User-Agent": pick(UAS) },
        signal: AbortSignal.timeout(10000)
      });
      if (!r.ok) continue;
      const text = await r.text();
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(trimmed)) {
          const [ip, portStr] = trimmed.split(":");
          const port = parseInt(portStr) || 8080;
          if (ip && port > 0 && port < 65536) {
            all.push({
              ip, port, protocol: proto,
              country: "", anonymity: "unknown",
              speed: 0, status: "unknown",
              url: `${proto}://${ip}:${port}`, source: "ProxyListDownload"
            });
          }
        }
      }
      await sleep(300);
    } catch (e) {}
  }
  return all.slice(0, 200);
}

async function scrapeAll(protocols) {
  const [ps, pp, pl] = await Promise.all([
    fetchProxyscrape(protocols), fetchPubproxy(protocols), fetchProxyListDownload(protocols)
  ]);
  const seen = new Set();
  const all = [];
  for (const p of [...ps, ...pp, ...pl]) {
    if (!seen.has(p.url)) { seen.add(p.url); all.push(p); }
  }
  return all;
}

async function testProxy(proxy, testUrl) {
  const start = Date.now();
  try {
    const r = await fetch(testUrl, {
      headers: { "User-Agent": pick(UAS) },
      signal: AbortSignal.timeout(6000),
      proxy: proxy.url
    });
    if (r.ok) {
      const elapsed = Date.now() - start;
      return { ...proxy, alive: true, responseTime: elapsed, status: statusLabel(elapsed), tested: true };
    }
  } catch (e) {}
  return { ...proxy, alive: false, status: "dead", tested: true };
}

async function testProxies(proxies, testUrl, concurrency) {
  const working = [];
  const queue = [...proxies];
  async function worker() {
    while (queue.length > 0) {
      const proxy = queue.shift();
      if (!proxy) break;
      const result = await testProxy(proxy, testUrl);
      if (result && result.alive) working.push(result);
    }
  }
  const workers = Array(Math.min(concurrency, queue.length)).fill(0).map(() => worker());
  await Promise.all(workers);
  working.sort((a, b) => a.responseTime - b.responseTime);
  return working;
}

module.exports = { parseProtocols, statusLabel, fetchProxyscrape, fetchPubproxy, fetchProxyListDownload, scrapeAll, testProxy, testProxies };
