const axios = require("axios");

async function googleTranslate(text, target, source) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source || "auto",
    tl: target,
    dt: "t",
    q: text
  });

  const { data } = await axios.get(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    { timeout: 172800000 }
  );

  const translated = data[0].map((chunk) => chunk[0]).join("");
  return { translated, detectedSource: data[2] };
}

module.exports = { googleTranslate };
