import axios from "axios";
import * as cheerio from "cheerio";

class AppleMusic {
  constructor() {
    this.client = axios.create({
      baseURL: "https://music.apple.com",
      headers: {
        authority: "music.apple.com",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        referer: "https://music.apple.com/",
        "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not:A-Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
    }
  });
}

async search(query, limit = 5) {
  try {
    if (!query) {
        throw new Error("Query is required");
      }

  const { data } = await this.client.get(`/us/search?term=${encodeURIComponent(query)}`);

  const $ = cheerio.load(data);
  const results = [];

  $('div[aria-label="Songs"] .track-lockup')
    .slice(0, limit)
    .each((_, el) => {
      const item = $(el);
      const title = item.find(".track-lockup__title a").text().trim() || null;
      const link = item.find(".track-lockup__title a").attr("href") || null;
      const artists = item.find(".track-lockup__subtitle a")
          .map((_, artist) =>
            $(artist).text().trim()
          ).get();
      const explicit = item.find('[data-testid="explicit-badge"]').length > 0;
      const rawCover = item.find('picture source[type="image/webp"]').attr("srcset")?.split(" ")[0] || null;
      const cover = rawCover ? rawCover.replace(/\/\d+x\d+/, "/600x600")
            : null;

    results.push({
      title,
      artist: artists.join(", "),
      explicit,
      cover: cover,
      url: link
    });
});

  return {
    success: true,
    total: results.length,
    result: results
  };
} catch (e) {
    return {
      status: false,
      message: e.response?.data?.message || e.message || "Unknown error",
      response: e.response?.data || null
      };
    }
  }
}

module.exports = { AppleMusic };
