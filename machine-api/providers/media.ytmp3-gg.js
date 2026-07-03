const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
  Accept: "application/json",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://media.ytmp3.gg/",
  Origin: "https://media.ytmp3.gg"
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }

  return json;
}

async function getVideoInfo(url) {
  return request(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    {
      headers: DEFAULT_HEADERS
    }
  );
}

async function createDownload(
  url,
  type = "video",
  format,
  quality = "1080p",
  bitrate = "128k"
) {
  format = type === "audio" ? "mp3" : "mp4";

  return request("https://hub.ytconvert.org/api/download", {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      os: "windows",
      output: {
        type,
        format,
        ...(type === "video" ? { quality } : {})
      },
      audio: {
        bitrate
      }
    })
  });
}

async function getStatus(statusUrl) {
  return request(statusUrl, {
    headers: DEFAULT_HEADERS
  });
}

async function ytmp3(url, options = {}) {
  const {
    type = "video",
    format,
    quality = "1080p",
    bitrate = "128k",
    interval = 2000
  } = options;

  const info = await getVideoInfo(url);
  const job = await createDownload(
    url,
    type,
    format,
    quality,
    bitrate
  );

  while (true) {
    const status = await getStatus(job.statusUrl);

    if (status.status === "completed") {
      return {
        type,
        title: info.title,
        channel: info.author_name,
        duration: status.duration,
        download: status.downloadUrl
      };
    }

    if (status.status === "failed") {
      throw new Error("Conversion failed");
    }

    await sleep(interval);
  }
}

module.exports = { getVideoInfo, createDownload, getStatus, ytmp3 };
