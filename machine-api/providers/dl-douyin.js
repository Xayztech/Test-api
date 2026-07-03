const axios = require('axios');
const FormData = require('form-data');

async function snapdouyin(url) {
  const form = new FormData();
  form.append('url', url);
  form.append('token', 'fb15a01280f80d78cbf2a86695612a0246c9a850573c49a6d984245a7ed2ee8b');
  form.append('hash', 'aHR0cHM6Ly92LmRvdXlpbi5jb20vU1d0eHZja3pISDQv1033YWlvLWRs');
  const headers = {
    ...form.getHeaders(),
  'Content-Type': 'application/x-www-form-urlencoded',
  'Origin': 'https://snapdouyin.app',
  'Referer': 'https://snapdouyin.app/id/',
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  'Sec-Ch-Ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?1',
  'Sec-Ch-Ua-Platform': '"Android"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Priority': 'u=1, i',
};

  const { data: response } = await axios.post('https://snapdouyin.app/wp-json/mx-downloader/video-data/', form, { headers });
  return response;
}

module.exports = { snapdouyin };
