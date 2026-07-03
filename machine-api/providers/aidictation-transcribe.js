const axios = require('axios');
const FormData = require('form-data');

async function aidictation(audio) {
    try {
        if (!Buffer.isBuffer(audio)) throw new Error('Audio buffer is required.');
        
        const { data: cf } = await axios.post('https:/cf.rynekoo.eu.cc/action', {
            url: 'https://aidictation.com/tools/transcribe',
            siteKey: '0x4AAAAAACgbDnY2xQyOrOfk',
            mode: 'turnstile-min'
        });
        
        if (!cf?.data?.token) throw new Error('Failed to get cf token.');
        
        const form = new FormData();
        form.append('file', audio, `${Date.now()}_rynn.mp3`);
        form.append('turnstile_token', cf.data.token);
        const { data } = await axios.post('https://aidictation.com/api/transcribe', form, {
            headers: {
                ...form.getHeaders(),
                origin: 'https://aidictation.com',
                referer: 'https://aidictation.com/tools/transcribe'
            }
        });
        
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { aidictation };
