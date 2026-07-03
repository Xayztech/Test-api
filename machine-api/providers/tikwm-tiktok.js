/**
 * 
 * base: https://www.tikwm.com
 * Creator: ShanMolvyr 
 * reupload/modif cantumkan sumber ini woii parah
 *
 * Note: cek https://snippet.vyr.my.id/shanmolvyr/tiktok-downloader/README.md
 * Sumber Scraper: https://whatsapp.com/channel/0029VbB4Kw8EFeXfeExaXc3Q
**/


import axios from 'axios';
import qs from 'qs';

const BASE = 'https://www.tikwm.com';
const API  = `${BASE}/api/`;
const CREDIT = { author: 'ShanMolvyr', github: 'https://github.com/Sanzzy111', provider: 'tikwm.com' };

const HEADERS = {
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'id-ID,id;q=0.9',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': BASE, 'Referer': BASE + '/',
  'Sec-Ch-Ua': '"Not)A;Brand";v="24","Chromium";v="116"',
  'Sec-Ch-Ua-Mobile': '?1', 'Sec-Ch-Ua-Platform': 'Android',
  'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-origin',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest'
};

const post = async (endpoint, body) => {
  const r = await axios.post(`${API}${endpoint}`, qs.stringify(body), { headers: HEADERS });
  if (r.data.code !== 0) throw new Error(r.data.msg || 'API error');
  return r.data.data;
};

const fmtNum  = n => { const x = parseInt(n); return isNaN(x) ? '0' : x.toLocaleString().replace(/,/g, '.'); };
const fmtDate = n => n ? new Date(n * 1000).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'numeric', minute:'numeric', second:'numeric' }) : null;
const url     = u => !u ? null : u.startsWith('http') ? u : BASE + u;

function parse(item) {
  if (!item) return null;
  const data = [];
  if ((!item.size || item.size === 0) && Array.isArray(item.images) && item.images.length > 0) {
    item.images.forEach(v => data.push({ type: 'photo', url: url(v) }));
  } else {
    if (item.wmplay) data.push({ type: 'watermark',      url: url(item.wmplay) });
    if (item.play)   data.push({ type: 'nowatermark',    url: url(item.play) });
    if (item.hdplay) data.push({ type: 'nowatermark_hd', url: url(item.hdplay) });
  }
  const musicUrl = item.music ? url(item.music) : item.music_info?.play ? url(item.music_info.play) : null;
  return {
    title: item.title || '', taken_at: fmtDate(item.create_time), region: item.region || null,
    id: item.id || item.video_id, duration: (item.duration || 0) + ' Seconds', cover: url(item.cover),
    size_wm: item.wm_size || 0, size_nowm: item.size || 0, size_nowm_hd: item.hd_size || null,
    data,
    music_info: item.music_info ? { id: item.music_info.id, title: item.music_info.title, author: item.music_info.author, album: item.music_info.album || null, url: musicUrl } : null,
    stats: { views: fmtNum(item.play_count), likes: fmtNum(item.digg_count), comment: fmtNum(item.comment_count), share: fmtNum(item.share_count), download: fmtNum(item.download_count) },
    author: { id: item.author?.id, username: item.author?.unique_id, nickname: item.author?.nickname, avatar: url(item.author?.avatar) }
  };
}

module.exports = { parse, post };
