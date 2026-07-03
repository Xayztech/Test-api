/** Youtube Play Mp3/Mp4
 * Base : https://ht[dot]flvto[dot]online
 * Sumber : https://whatsapp.com/channel/0029VbAj9Sd47XeLArtDqO3X
 * Author : ONLym-Api
 * Note : Output Url Download nya cepet gak nyampe 5 detik bahkan buat youtube 3 jam
 **/

const youtubeSearch = async (query) => {
    if (typeof (query) !== "string" || query.length === 0) throw Error(`invalid query`)
 
    const headers = {
        "Accept-Encoding": "gzip, deflate, br, zstd"
    }
 
    const body = JSON.stringify({
        "context": {
            "client": {
                "hl": "en",
                "gl": "ID",
                "clientName": "WEB",
                "clientVersion": "2.20250701.09.00",
            },
        },
        "params": "EgIQAQ%3D%3D",
        query
    });
 
    const response = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', { headers, body, "method": "post" })
    if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text()}`)
    const json = await response.json()
 
    const result = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
        .filter(v => v?.videoRenderer?.lengthText?.simpleText).map(v => {
            const vr = v.videoRenderer
            const videoId = vr.videoId
            return {
                videoId,
                title: vr.title.runs[0].text,
                channel: vr.ownerText.runs[0].text,
                url: `https://youtu.be/${videoId}`,
                thumbnail: vr.thumbnail.thumbnails[1]?.url || vr.thumbnail.thumbnails[0]?.url,
                duration: vr.lengthText.simpleText,
                datePassed: vr.publishedTimeText?.simpleText || null,
                views: vr.shortViewCountText.simpleText
            }
        })
 
    if (result.length === 0) throw Error(`tidak bisa menemukan video dari keyword ${query}`)
    return result
}

const download = async (videoId, format = "mp3") => {
    const headers = {
        "accept-encoding": "gzip, deflate, br, zstd",
        "origin": "https://ht.flvto.online",
    }
    const body = JSON.stringify({
        "id": videoId,
        "fileType": format
    })
    const response = await fetch(`https://ht.flvto.online/converter`, { headers, body, method: "post" })
    if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text()}`)
    return await response.json()
}

const extractVideoId = (input) => {
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

const ytdl = async (input, format = "mp3") => {
    try {
        let videoId = extractVideoId(input);

        if (!videoId) {
            const searchResults = await youtubeSearch(input);
            videoId = searchResults[0].videoId;
        }

        const cleanFormat = format.trim().toLowerCase();
        const requestFormat = cleanFormat === 'mp4' ? 'MP4' : 'mp3';

        const dlData = await download(videoId, requestFormat);

        if (!dlData || (dlData.status !== 'ok' && dlData.status !== 'success')) {
            throw new Error(dlData.msg || "Gagal memproses konversi video.");
        }

        let finalDownloadUrl = '';
        if (dlData.link) {
            finalDownloadUrl = dlData.link;
        } else if (dlData.formats && dlData.formats.length > 0) {
            finalDownloadUrl = dlData.formats[0].url;
        }

        if (!finalDownloadUrl) {
            throw new Error("Gagal mengekstrak tautan URL unduhan dari respons server.");
        }

        return {
            status: true,
            creator: "ONLym-Api",
            result: {
                videoId,
                title: dlData.title || "Unknown Title",
                format: cleanFormat,
                filesize: dlData.filesize || dlData.formats?.[0]?.bitrate || 0,
                duration: dlData.duration || dlData.formats?.[0]?.approxDurationMs ? (parseInt(dlData.formats[0].approxDurationMs) / 1000) : 0,
                download_url: finalDownloadUrl
            }
        };

    } catch (error) {
        return {
            status: false,
            creator: "ONLym-Api",
            message: error.message
        };
    }
}

module.exports = { youtubeSearch, download, extractVideoId, ytdl };
