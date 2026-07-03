const axios = require('axios');

async function vidssaveDownload(link) {
    try {
        const parseBody = new URLSearchParams({
            auth: '20250901majwlqo',
            domain: 'api-ak.vidssave.com',
            origin: 'source',
            link: link
        }).toString();

        const parseRes = await axios.post('https://api.vidssave.com/api/contentsite_api/media/parse', parseBody, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Origin': 'https://vidssave.com', 
                'Referer': 'https://vidssave.com/' 
            }
        });

        const videoData = parseRes.data.data;
        if (!videoData || !videoData.resources) return { error: "No resources found" };

        const processResource = async (resItem) => {
            try {
                if (resItem.download_url && resItem.download_url !== "") {
                    return {
                        quality: resItem.quality || 'Default',
                        type: resItem.type,
                        format: resItem.format,
                        size: resItem.size,
                        url: resItem.download_url
                    };
                }

                if (!resItem.resource_content || resItem.resource_content === "") {
                    return null;
                }

                const downloadBody = new URLSearchParams({
                    auth: '20250901majwlqo',
                    domain: 'api-ak.vidssave.com',
                    request: resItem.resource_content,
                    no_encrypt: '1'
                }).toString();

                const taskRes = await axios.post('https://api.vidssave.com/api/contentsite_api/media/download', downloadBody, {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded', 
                        'Origin': 'https://vidssave.com', 
                        'Referer': 'https://vidssave.com/' 
                    }
                });

                if (!taskRes.data.data || !taskRes.data.data.task_id) return null;

                const taskId = taskRes.data.data.task_id;
                let finalUrl = null;
                let attempts = 0;

                while (!finalUrl && attempts < 15) {
                    const queryRes = await axios.get(`https://api.vidssave.com/sse/contentsite_api/media/download_query`, {
                        params: {
                            auth: '20250901majwlqo',
                            domain: 'api-ak.vidssave.com',
                            task_id: taskId,
                            download_domain: 'vidssave.com',
                            origin: 'content_site'
                        }
                    });

                    if (queryRes.data.includes('"status":"success"')) {
                        const match = queryRes.data.match(/"download_link":"(.*?)"/);
                        if (match) {
                            finalUrl = match[1].replace(/\\/g, '');
                            break;
                        }
                    } else if (queryRes.data.includes('"status":"failed"')) {
                        break;
                    }
                    
                    attempts++;
                    await new Promise(r => setTimeout(r, 1500));
                }

                return finalUrl ? {
                    quality: resItem.quality || 'Default',
                    type: resItem.type,
                    format: resItem.format,
                    size: resItem.size,
                    url: finalUrl
                } : null;

            } catch (e) {
                return null;
            }
        };

        const resultsRaw = await Promise.all(videoData.resources.map(res => processResource(res)));
        const downloadResults = resultsRaw.filter(item => item !== null);

        return {
            title: videoData.title,
            thumbnail: videoData.thumbnail,
            duration: videoData.duration,
            results: downloadResults
        };

    } catch (error) {
        return { error: error.message };
    }
}

module.exports = { vidssaveDownload };
