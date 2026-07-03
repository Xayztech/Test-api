/** Spotify Downloader Track
 * Base : https://spowload[dot]cc/
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Auto Ambil CSRF Token, data playlist : url, title, artist, duration_ms, thumbnail.
**/

const axios = require('axios');

const spowload = {
    download: async (spotifyUrl) => {
        try {
            const matchType = spotifyUrl.match(/(track|playlist)/i);
            const matchId = spotifyUrl.match(/([a-zA-Z0-9]{22})/);
            if (!matchType || !matchId) throw new Error("Tautan URL Spotify tidak valid.");

            const type = matchType[0].toLowerCase();
            const id = matchId[0];

            const initResponse = await axios.get('https://spowload.cc/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });

            const rawCookies = initResponse.headers['set-cookie'];
            if (!rawCookies) throw new Error("Gagal mengamankan secure cookies dari server hulu.");

            const cookieString = rawCookies.map(c => c.split(';')[0]).join('; ');
            
            const tokenMatch = initResponse.data.match(/name="_token"\s+value="([^"]+)"/) || initResponse.data.match(/value="([^"]+)"\s+name="_token"/);
            const csrfTokenPlain = tokenMatch ? tokenMatch[1] : '';

            const targetPath = '/spotify/' + type + '-' + id;
            const detailPage = await axios.get('https://spowload.cc' + targetPath, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Cookie': cookieString
                }
            });

            const scriptMatch = detailPage.data.match(/let\s+urldata\s*=\s*"([\s\S]*?)";/);
            if (!scriptMatch) throw new Error("Gagal mengekstrak komponen metadata dari halaman hulu.");

            let cleanJsonString = scriptMatch[1].replace(/\\"/g, '"').replace(/\\\//g, '/');
            const meta = JSON.parse(cleanJsonString);

            let coverUrl = '';
            if (meta.type === 'track') {
                coverUrl = meta.album?.images?.[0]?.url || '';
            } else if (meta.type === 'playlist') {
                coverUrl = meta.images?.[0]?.url || '';
            }
            coverUrl = coverUrl.replace(/\\/g, '');

            const response = await axios.post('https://spowload.cc/convert', {
                urls: spotifyUrl,
                cover: coverUrl
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Origin': 'https://spowload.cc',
                    'Referer': 'https://spowload.cc' + targetPath,
                    'Cookie': cookieString,       
                    'X-CSRF-TOKEN': csrfTokenPlain 
                }
            });

            if (!response.data || response.data.error !== false) {
                throw new Error(response.data?.message || "Server spowload gagal memproses konversi berkas.");
            }

            const baseProxy = 'https://open.spotify.com/';

            if (meta.type === 'track') {
                const artists = meta.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
                return {
                    status: true,
                    creator: "ONLym-Api",
                    type: "track",
                    result: {
                        url: baseProxy + 'track/' + meta.id,
                        title: meta.name,
                        artist: artists,
                        album: meta.album?.name || "N/A",
                        duration_ms: meta.duration_ms,
                        explicit: meta.explicit || false,
                        thumbnail: coverUrl,
                        download_url: response.data.url
                    }
                };
            }

            if (meta.type === 'playlist') {
                const tracks = meta.tracks?.items?.map(item => {
                    let trackCover = item.track?.album?.images?.[0]?.url || '';
                    return {
                        url: item.track?.id ? baseProxy + 'track/' + item.track.id : null,
                        title: item.track?.name,
                        artist: item.track?.artists?.map(a => a.name).join(', '),
                        duration_ms: item.track?.duration_ms,
                        thumbnail: trackCover.replace(/\\/g, '')
                    };
                }) || [];

                return {
                    status: true,
                    creator: "ONLym-Api",
                    type: "playlist",
                    result: {
                        url: baseProxy + 'playlist/' + meta.id,
                        title: meta.name,
                        owner: meta.owner?.display_name || "Unknown",
                        total_tracks: tracks.length,
                        thumbnail: coverUrl,
                        tracks: tracks,
                        download_url: response.data.url
                    }
                };
            }

        } catch (error) {
            return {
                status: false,
                creator: "ONLym-Api",
                message: error.response ? ('Request failed with status code ' + error.response.status) : error.message
            };
        }
    }
};

module.exports = { spowload };
