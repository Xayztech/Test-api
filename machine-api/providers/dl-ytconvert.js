/**
 * Ytconvert download mp4/mp3
 * base: https://ytconvert.org/
 * Sumber: https://gist.vyr.my.id/shanmolvyr/ytconvert
 * Youtube Mp3 & Mp4 Downloader, mp4: 360p 480p 720p 1080p 1440p 2160p - MP3: 128 192 256 320 via ytconvert.org
 */
const BASE = 'https://ytdl.y2mp3.co/api';
const H = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36',
  'Referer': 'https://ytconvert.org/',
};

function extractId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  throw new Error('Invalid YouTube URL');
}

async function getInfo(url) {
  const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  if (!r.ok) throw new Error(`oEmbed ${r.status}`);
  const d = await r.json();
  return { title: d.title, author: d.author_name, thumbnail: d.thumbnail_url };
}

async function submit(url, type, format, quality) {
  const r = await fetch(`${BASE}/v2/download`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ url, output: { type, format, quality } }),
  });
  if (!r.ok) throw new Error(`Submit ${r.status}`);
  const d = await r.json();
  if (!d.statusUrl) throw new Error('No statusUrl');
  return d;
}

async function poll(statusUrl, interval = 3000, timeout = 120000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const r = await fetch(statusUrl, { headers: H });
    if (!r.ok) throw new Error(`Poll ${r.status}`);
    const d = await r.json();
    if (d.status === 'completed') return d;
    if (d.status === 'error' || d.status === 'failed') throw new Error(`Job ${d.status}`);
    process.stderr.write(`\r  [${d.status}] ${d.progress ?? 0}%   `);
    await new Promise(res => setTimeout(res, interval));
  }
  throw new Error('Timeout');
}

async function run(url, format, quality) {
  const isAudio = format === 'mp3';
  const type = isAudio ? 'audio' : 'video';
  const q = quality || (isAudio ? '320' : '2160p');

  const [info, job] = await Promise.all([
    getInfo(url),
    submit(url, type, format, q),
  ]);

  const result = await poll(job.statusUrl);
  process.stderr.write('\n');

  return {
    title: info.title,
    author: info.author,
    thumbnail: info.thumbnail,
    format,
    requested_quality: q,
    selected_quality: job.selectedQuality ?? result.selectedQuality,
    quality_changed: job.qualityChanged ?? false,
    quality_change_reason: job.qualityChangeReason ?? null,
    duration: result.duration,
    download_url: result.downloadUrl,
  };
}

if (require.main === module) {
  const [,, url, format = 'mp4', quality] = process.argv;

  if (!url) {
    console.error('Usage: node ytconvert.js <url> [mp4|mp3] [quality]');
    console.error('  node ytconvert.js https://youtu.be/xxx');
    console.error('  node ytconvert.js https://youtu.be/xxx mp4 720p');
    console.error('  node ytconvert.js https://youtu.be/xxx mp3 128');
    process.exit(1);
  }

  run(url, format, quality)
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e.message); process.exit(1); });
}

module.exports = { extractId, getInfo, submit, poll, run };