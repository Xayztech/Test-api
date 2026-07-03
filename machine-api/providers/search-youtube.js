const youtubeSearch = async (query) => {
    if (typeof (query) !== "string" || query.length === 0) throw Error(`invalid query`)
 
    const headers = {
        "Accept-Encoding": "gzip, deflate, br, zstd"
    }
 
    const body = JSON.stringify({
        "context": {
            "client": {
                "hl": "en", // ubah ke id kalau mau result bahasa indo
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
            const obj = {
                videoId,
                title: vr.title.runs[0].text,
                channel: vr.ownerText.runs[0].text,
                url: `https://youtu.be/${videoId}`,
                thumbnail: vr.thumbnail.thumbnails[1]?.url || vr.thumbnail.thumbnails[0]?.url,
                duration: vr.lengthText.simpleText,
                datePassed: vr.publishedTimeText?.simpleText || null,
                views: vr.shortViewCountText.simpleText
            }
            return obj
        })
 
    if (result.length === 0) throw Error(`tidak bisa menemukan video dari keyword ${query}`)
    return result
 
}

module.exports = { youtubeSearch };
