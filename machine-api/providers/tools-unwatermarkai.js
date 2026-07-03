const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')
const crypto = require('crypto')

async function createjob(img, productSerial) {
  const form = new FormData()

  form.append(
    'original_image_file',
    fs.createReadStream(img),
    {
      filename: img.split('/').pop()
    }
  )

  form.append('output_format', 'jpg')
  form.append('is_remove_text', 'true')
  form.append('is_remove_logo', 'true')
  form.append('is_enhancer', 'true')

  const r = await axios.post('https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/create-job',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Product-Serial': productSerial,
        'Product-Code': '067003',
        origin: 'https://unwatermark.ai',
        referer: 'https://unwatermark.ai/'
      }
    }
  )

  return r.data.result.job_id
}

async function getjob(jobId, productSerial) {
  const r = await axios.get(`https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/get-job/${jobId}`,
    {
      headers: {
        'Product-Serial': productSerial,
        'Product-Code': '067003',
        origin: 'https://unwatermark.ai',
        referer: 'https://unwatermark.ai/'
      }
    }
  )

  return r.data
}

async function unwatermark(img) {
  const productSerial = crypto.randomUUID()
  const jobId = await createjob(img, productSerial)

  while (true) {
    await new Promise(r => setTimeout(r, 3000))
    const s = await getjob(jobId, productSerial)

    if (s.code === 100000 && s.result?.output_url) {
      return {
        job_id: jobId,
        input_url: s.result.input_url,
        output_url: Array.isArray(s.result.output_url)
          ? s.result.output_url[0]
          : s.result.output_url
      }
    }
  }
}

module.exports = { createjob, getjob, unwatermark };
