const axios = require('axios');

async function downr(url) {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    try {
        if (!url.includes('https://')) throw new Error('Invalid url.');
        
        const analyticsRes = await axios.get('https://downr.org/.netlify/functions/analytics', {
            headers: {
                'referer': 'https://downr.org/',
                'user-agent': userAgent
            }
        });
        
        const setCookies = analyticsRes.headers['set-cookie'] || [];
        const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

        let downloadRes;
        let lastErr = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await axios.post('https://downr.org/.netlify/functions/nyt', 
                { url: url }, 
                {
                    headers: {
                        'accept': '*/*',
                        'content-type': 'application/json',
                        'cookie': cookieHeader,
                        'origin': 'https://downr.org',
                        'referer': 'https://downr.org/',
                        'user-agent': userAgent
                    }
                });

                const data = response.data;
                
                const isRetry = typeof data === 'string' 
                    ? data.includes('user_retry_required') 
                    : (data.error === 'user_retry_required' || data.message === 'user_retry_required');

                if (isRetry) {
                    lastErr = data;
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }

                downloadRes = data;
                break; 
            } catch (e) {
                lastErr = e.response?.data || e.message;
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (!downloadRes) throw new Error(JSON.stringify(lastErr));
        
        return downloadRes;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { downr };
