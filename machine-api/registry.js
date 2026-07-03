function P(name) {
  try {
    return require(`./providers/${name}`);
  } catch (err) {
    console.warn(`[registry] provider "${name}" gagal dimuat: ${err.message}`);
    const handler = {
      get() {
        return async () => {
          throw new Error(`Provider "${name}" tidak tersedia (dependency hilang: ${err.message})`);
        };
      },
      apply() {
        throw new Error(`Provider "${name}" tidak tersedia (dependency hilang: ${err.message})`);
      }
    };
    return new Proxy(function () {}, handler);
  }
}

const savetubeA = P("#REAL-savetube.js");
const savetubeB = P("savetube-me.js");
const savetubeC = P("youtubedownload.js");
const ytdl2 = P("ytdl2.js");
const ytSiputzx = P("ytdl-siputzx.js");
const ytOneDl = P("ytdl-onedownloader.js");
const ytCnvMp3 = P("ytdl-cnvmp3.js");
const ytMediaGg = P("media.ytmp3-gg.js");
const ytMp4IsA = P("ytdl-ytmp4.is.js");
const ytMp4IsB = P("ytdl-ytmp4-is.js");
const ytOn4t = P("ytdl-on4t.js");
const ytY2mateNu = P("ytdl-v3.y2mate-nu.js");
const ytY2mateV22 = P("ytdl-v22.www-y2mate.js");
const ytY2mateV2 = P("ytdl-v2.www-y2mate.js");
const ytSavenowA = P("ytdl-p.savenow-to.js");
const ytSavenowB = P("p.savenow-to.js");
const aioDownr = P("aio-downr.js");
const aioSavefrom = P("aio-savefrom.js");
const aioVidssave = P("aio-vidssave.js");
const aioRapidapi = P("aio-rapidapi.js");
const ythd = P("ythd.js");
const svtbXayz = P("#REAL-SVTB-xayz-yt.js");
const ytLegacy = P("yt.js");
const ytdlFast = P("ytdl-fast.js");
const ytY2mateCoZa = P("ytdl-ytmp4.co-za.js");
const ytSearch = P("search-youtube.js");
const ytMediaSearch = P("media.ytmp3-gg.js");
const ytTranscript = P("yt-transcript.js");
const ytTranscribe = P("aidictation-transcribe.js");

const tiktokDlA = P("dl-tiktok.js");
const tiktokDlB = P("tiktok.js");
const tikwm = P("tikwm-tiktok.js");
const tiktokStories = P("dl-tiktokstories.js");
const savett = P("dl-savett.js");
const fastdl = P("dl-fastdl.js");
const tikvideoApp = P("dl-tikvideo.app.js");
const searchTiktokA = P("search-tiktok.js");
const searchTiktokB = P("search-tiktok2.js");
const searchTiktokio = P("search-tiktokio.js");

const spotifyMain = P("spotify.js");
const spotifyMeta = P("spotify-metadata.js");
const spotifyDl2 = P("spotify-dl-2.js");
const spotifyDlapi = P("dl-spotify-dlapi.js");
const spotifyGamepvz = P("dl-spotifygamepvz.js");
const spotisaver = P("dl-spotisaver.js");
const spotitrack = P("dl-spotitrack.js");
const spowload = P("dl-spowload.js");
const spodownloader = P("spodownloader.js");
const spotidownloader = P("spotidownloader.js");
const spotmate = P("spotmate.js");
const searchSpotifyA = P("search-spotify.js");
const searchSpotifyB = P("search-spotify2.js");

const igReels = P("dl-reelsvideo.io.js");
const igDownloadgram = P("downloadgram-org.js");

const fbDl = P("dl-facebook.js");

const twSavetwitter = P("dl-savetwitter.js");

const capcutDl = P("dl-capcut.js");
const douyinDl = P("dl-douyin.js");
const mediafireDl = P("mediafire.js");
const imgurUp = P("up-imgur.js");

const geniusA = P("search-genius.js");
const geniusB = P("search-genius2.js");
const itunesSearch = P("search-itunes.js");
const appleMusicSearch = P("search-applemusic.js");

const removeBgMain = P("remove-background.js");
const removeBgAi = P("removebg-removalai.js");
const caseRemoveBg = P("case-removebg.js");
const reminiHD = P("tools-remini.js");
const colorizer = P("tools-colorize.js");
const unwatermark = P("tools-unwatermarkai.js");
const ihancer = P("upscale-ihancer.js");
const imglarger = P("upscale-imglarger.js");
const picsart = P("upscale-picsart.js");
const waifu2x = P("upscale-waifux2.js");
const caseHd = P("case-hd.js");
const caseNanobanana = P("case-nanobanana.js");
const caseTopixel = P("case-topixel.js");
const bratImg = P("brat-img.js");
const bratVid = P("bratvid.js");
const iqcDark = P("iqc-dark.js");
const iqcImage = P("iqc-image.js");
const noiseRemover = P("noiseremover-paradigm.js");

const bypassUnlock = P("bypassunlock.js");
const cloneWebToZip = P("clonewebtozip.js");
const jsObfuscator = P("obfuscator.js");
const proxyScrape = P("proxyscrape.js");
const ssweb1 = P("ssweb-1.js");
const ssweb2 = P("ssweb-2.js");
const mcpedlSearch = P("mcpedl-search.js");
const mcpedlDetail = P("mcpedl-detail.js");
const scraperMisc = P("scraper.js");

const aiChatgpt = P("ai-chatgpt.js");
const aiChatgpt3 = P("ai-chatgpt3.js");
const aiClaude = P("ai-cloude.js");
const aiClaudeSonnet = P("ai-cloude-sonnet.js");
const aiGeminiScraper = P("ai-gemini.js");
const aiGemini3Scraper = P("ai-gemini3.js");

const REGISTRY = {
  yt: {
    label: "YouTube",
    search: [
      { name: "search-youtube", fn: ytSearch.youtubeSearch },
      { name: "ytdl-fast", fn: ytdlFast.youtubeSearch },
      { name: "ytdl-media.ytmp3-gg", fn: ytMediaSearch.getVideoInfo },
      { name: "ytdl-ytmp4.co-za", fn: ytY2mateCoZa.youtubeSearch },
      { name: "yt-legacy", fn: ytLegacy.ytSearch }
    ],
    download: [
      { name: "savetube-real", fn: (url, q) => savetubeA(url, q) },
      { name: "savetube-me", fn: savetubeB.savetube },
      { name: "youtubedownload-savetube", fn: (url, q) => savetubeC(url, q) },
      { name: "ytdl2", fn: (url, q) => new ytdl2().download ? new ytdl2().download(url, q) : ytdl2(url, q) },
      { name: "ytdl-siputzx", fn: ytSiputzx.downloadVideo },
      { name: "ytdl-onedownloader", fn: ytOneDl.onedl },
      { name: "ytdl-cnvmp3", fn: ytCnvMp3.cnvmp3 },
      { name: "ytdl-media.ytmp3-gg", fn: ytMediaGg.ytmp3 },
      { name: "ytdl-ytmp4.is", fn: ytMp4IsA.ytmp4is },
      { name: "ytdl-ytmp4-is", fn: ytMp4IsB.ytmp4is },
      { name: "ytdl-y2mate-v22", fn: ytY2mateV22.y2mate },
      { name: "ytdl-savenow-a", fn: ytSavenowA.downloadYT },
      { name: "ytdl-savenow-b", fn: ytSavenowB.downloadYT },
      { name: "aio-downr", fn: aioDownr.downr },
      { name: "aio-savefrom", fn: aioSavefrom.savefrom },
      { name: "aio-vidssave", fn: aioVidssave.vidssaveDownload },
      { name: "aio-rapidapi", fn: aioRapidapi.aiorapidapi },
      { name: "ythd", fn: ythd.ythd },
      { name: "svtb-xayz", fn: svtbXayz },
      { name: "yt-legacy-mp4", fn: ytLegacy.ytDonlodMp4 },
      { name: "yt-legacy-mp3", fn: ytLegacy.ytDonlodMp3 }
    ],
    extra: {
      transcript: ytTranscript,
      transcribe: ytTranscribe.aidictation
    }
  },

  tiktok: {
    label: "TikTok",
    search: [
      { name: "search-tiktok", fn: searchTiktokA.main },
      { name: "search-tiktok2", fn: searchTiktokB.tikwmPhotoSearch },
      { name: "search-tiktokio", fn: searchTiktokio.getTikTokDownloadInfo }
    ],
    download: [
      { name: "tikwm", fn: tikwm.parse },
      { name: "dl-tiktok", fn: tiktokDlA.download },
      { name: "tiktok-legacy", fn: tiktokDlB.tiktokDl },
      { name: "dl-savett", fn: savett.savett },
      { name: "dl-fastdl", fn: fastdl.fastdl },
      { name: "dl-tiktokstories", fn: tiktokStories.getTikTokData },
      { name: "dl-tikvideo.app", fn: tikvideoApp.tiktokTikVideo }
    ]
  },

  spotify: {
    label: "Spotify",
    search: [
      { name: "search-spotify2", fn: searchSpotifyB.spotifysearch },
      { name: "search-spotify", fn: searchSpotifyA }
    ],
    download: [
      { name: "spotify-metadata", fn: spotifyMeta },
      { name: "spotify-main", fn: spotifyMain },
      { name: "spotify-dl-2", fn: spotifyDl2 },
      { name: "dl-spotify-dlapi", fn: spotifyDlapi.main },
      { name: "dl-spotitrack", fn: spotitrack.getLatestNextAction },
      { name: "dl-spotisaver", fn: spotisaver },
      { name: "spotmate", fn: spotmate.spotmate },
      { name: "spotidownloader", fn: spotidownloader.spotidownloader },
      { name: "spodownloader", fn: spodownloader.spodownloader },
      { name: "dl-spotifygamepvz", fn: spotifyGamepvz.getSpotify },
      { name: "dl-spowload", fn: spowload }
    ]
  },

  instagram: {
    label: "Instagram",
    download: [
      { name: "aio-downr", fn: aioDownr.downr },
      { name: "aio-savefrom", fn: aioSavefrom.savefrom },
      { name: "aio-vidssave", fn: aioVidssave.vidssaveDownload },
      { name: "dl-reelsvideo.io", fn: igReels.reelsvideo },
      { name: "downloadgram-org", fn: igDownloadgram.downloadGram }
    ]
  },

  facebook: {
    label: "Facebook",
    download: [
      { name: "dl-facebook", fn: fbDl.fetchWithRetry },
      { name: "aio-downr", fn: aioDownr.downr },
      { name: "aio-savefrom", fn: aioSavefrom.savefrom }
    ]
  },

  twitter: {
    label: "Twitter / X",
    download: [
      { name: "dl-savetwitter", fn: twSavetwitter.savetwitter },
      { name: "aio-savefrom", fn: aioSavefrom.savefrom }
    ]
  },

  capcut: {
    label: "CapCut",
    download: [{ name: "dl-capcut", fn: capcutDl.CapcutDl }]
  },

  douyin: {
    label: "Douyin",
    download: [{ name: "dl-douyin", fn: douyinDl.snapdouyin }]
  },

  mediafire: {
    label: "Mediafire",
    download: [{ name: "mediafire", fn: mediafireDl.mediafireDl }]
  },

  imgur: {
    label: "Imgur Upload",
    upload: [{ name: "up-imgur", fn: imgurUp.uploadToImgur }]
  },

  genius: {
    label: "Genius Lyrics",
    search: [
      { name: "search-genius", fn: geniusA.geniusLyrics },
      { name: "search-genius2", fn: geniusB.search }
    ]
  },

  applemusic: {
    label: "Apple Music / iTunes",
    search: [
      { name: "search-itunes", fn: itunesSearch.searchAppleMusic },
      { name: "search-applemusic", fn: appleMusicSearch }
    ]
  },

  removebg: {
    label: "Remove Background",
    process: [
      { name: "remove-background", fn: removeBgMain.removeBackground },
      { name: "removebg-removalai", fn: removeBgAi.removebg },
      { name: "case-removebg-onlym", fn: caseRemoveBg.removeBgOnlym }
    ]
  },

  upscale: {
    label: "Upscale / HD Enhance",
    process: [
      { name: "tools-remini", fn: reminiHD.reminiHD },
      { name: "case-hd-onlym", fn: caseHd.hdUpscale },
      { name: "upscale-ihancer", fn: ihancer.main },
      { name: "upscale-imglarger", fn: imglarger.upload },
      { name: "upscale-waifux2", fn: waifu2x.waifu2x },
      { name: "upscale-picsart", fn: picsart }
    ]
  },

  imagetools: {
    label: "Image Tools Lainnya",
    colorize: [{ name: "tools-colorize", fn: colorizer.Colorizer }],
    unwatermark: [{ name: "tools-unwatermarkai", fn: unwatermark.unwatermark }],
    nanobanana: [{ name: "case-nanobanana", fn: caseNanobanana.nanoBananaEdit }],
    topixel: [{ name: "case-topixel", fn: caseTopixel.toPixel }],
    bratimg: [{ name: "brat-img", fn: bratImg.generateBrat }],
    bratvid: [{ name: "bratvid", fn: bratVid.generateBratVideo }],
    noiseremover: [{ name: "noiseremover-paradigm", fn: noiseRemover.NoiseRemover }]
  },

  tools: {
    label: "Tools Lainnya",
    bypassunlock: [{ name: "bypassunlock", fn: bypassUnlock.bypass }],
    clonewebtozip: [{ name: "clonewebtozip", fn: cloneWebToZip }],
    obfuscator: [{ name: "obfuscator", fn: jsObfuscator.jsObfuscator }],
    proxyscrape: [{ name: "proxyscrape", fn: proxyScrape.fetchProxyscrape }],
    screenshot: [
      { name: "ssweb-2", fn: ssweb2.screenshot },
      { name: "ssweb-1", fn: ssweb1.screenshotWeb }
    ]
  },

  mcpedl: {
    label: "MCPEDL (Minecraft Addons)",
    search: [{ name: "mcpedl-search", fn: mcpedlSearch }],
    detail: [{ name: "mcpedl-detail", fn: mcpedlDetail }]
  },

  misc: {
    label: "Misc Scraper",
    pinterest: [{ name: "scraper-pinterest", fn: scraperMisc.pinterest }],
    wallpaper: [{ name: "scraper-wallpaper", fn: scraperMisc.wallpaper }],
    wikimedia: [{ name: "scraper-wikimedia", fn: scraperMisc.wikimedia }]
  },

  ai: {
    label: "AI Chat (raw providers dari All-api.zip, dipakai sebagai fallback tambahan)",
    chatgpt: [
      { name: "ai-chatgpt", fn: aiChatgpt },
      { name: "ai-chatgpt3", fn: aiChatgpt3 }
    ],
    claude: [
      { name: "ai-cloude-sonnet", fn: aiClaudeSonnet.chat },
      { name: "ai-cloude", fn: aiClaude }
    ],
    gemini_scraper: [
      { name: "ai-gemini", fn: aiGeminiScraper.send },
      { name: "ai-gemini3", fn: aiGemini3Scraper.bootstrap }
    ]
  }
};

module.exports = { REGISTRY };
