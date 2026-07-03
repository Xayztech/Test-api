// credit : https://starlabs.biz.id/

const https = require('https');

class TikTokSearch {
    constructor() {
        this.apiUrl = 'www.revid.ai';
        this.endpoint = '/api/tiktok-search';
    }

    async search(keywords, options = {}) {
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        
        const payload = {
            keywords: keywords,
            filtersFast: [
                "nbChar > 10",
                "lang = 'en'",
                `createTime >= ${Math.floor(oneYearAgo / 1000)} AND createTime <= ${Math.floor(now / 1000)}`
            ],
            extraParams: {
                sort: options.sort || ""
            }
        };

        const postData = JSON.stringify(payload);
        const limit = options.limit || 10;

        return new Promise((resolve) => {
            const reqOptions = {
                hostname: this.apiUrl,
                port: 443,
                path: this.endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const req = https.request(reqOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk.toString();
                });
                
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const videos = (json.videos || []).slice(0, limit);
                        
                        const results = videos.map(v => ({
                            id: v.id,
                            title: v.desc?.substring(0, 100) || '',
                            description: v.desc || '',
                            full_text: v.text || '',
                            content_summary: v.contentSummary || '',
                            duration: v.durationInSeconds,
                            play_count: v.playCount,
                            like_count: v.diggCount,
                            comment_count: v.commentCount,
                            share_count: v.shareCount,
                            author: v.userNickname,
                            username: v.username,
                            hashtags: v.hashtags ? JSON.parse(v.hashtags) : [],
                            video_url: v.url,
                            download_url: v.urlUploaded,
                            created_at: v.createTime
                        }));
                        
                        resolve({
                            success: true,
                            author: 'BINTANG',
                            creator: 'BINTANG',
                            data: {
                                query: keywords,
                                total: videos.length,
                                videos: results
                            }
                        });
                    } catch(e) {
                        resolve({
                            success: false,
                            author: 'BINTANG',
                            creator: 'BINTANG',
                            error: 'Failed to parse response: ' + e.message
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    author: 'BINTANG',
                    creator: 'BINTANG',
                    error: error.message
                });
            });
            
            req.write(postData);
            req.end();
        });
    }
}

async function main() {
    const args = process.argv.slice(2);
    const tiktok = new TikTokSearch();
    
    if (args.length === 0) {
        console.log(JSON.stringify({
            success: false,
            author: 'BINTANG',
            creator: 'BINTANG',
            error: 'Usage: node tiktok.js "search keyword" [--limit 5]'
        }, null, 2));
        process.exit(0);
    }
    
    let keyword = args[0];
    let limit = 10;
    
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--limit' && args[i + 1]) {
            limit = parseInt(args[i + 1]);
            i++;
        }
    }
    
    const result = await tiktok.search(keyword, { limit });
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { main };
