/**
 * @credit: ren-offc
 * @noted: don't delete the credit
 */
async function photoihancer(imagePath, method = 1) {
  const fs = await import('fs');

  const imageBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

  const form = new FormData();
  form.set('method', String(method));
  form.set('is_pro_version', 'true');
  form.set('is_enhancing_more', 'false');
  form.set('max_image_size', 'high');
  form.set('file', blob, 'file.jpg');

  const res = await fetch('https://ihancer.com/api/enhance', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://ihancer.com/app/',
    },
    body: form,
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main(imagePath, outputPath, method = 1) {
  const fs = await import('fs');
  const result = await photoihancer(imagePath, method);
  fs.writeFileSync(outputPath, result);
}

module.exports = { photoihancer, main };
