import mql from "@microlink/mql";

const CONFIG = {
  input: "https://github.com",
  width: 1920,
  height: 1080,
  waitFor: 3000,
  fullPage: false,
  element: null
};

async function screenshotWeb(config = CONFIG) {
  const options = {
    screenshot: {
      optimizeForSpeed: true,
      fullPage: config.fullPage
    },
    viewport: {
      width: config.width,
      height: config.height
    },
    waitFor: config.waitFor,
    meta: false
  };

  if (config.element) {
    options.screenshot.element = config.element;
  }

  const res = await mql(config.input, options);
  const data = res.data || {};
  const code = res.statusCode || res.status || data.statusCode || data.status || 200;
  const resultUrl = data.screenshot?.url || null;
  const ok = !!resultUrl;

  return {
    Status: ok,
    Code: code,
    Input: config.input,
    Result_url: resultUrl,
    Error: ok ? null : data.error?.message || data.message || "Screenshot failed"
  };
}

async function main() {
  try {
    const result = await screenshotWeb();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          Status: false,
          Code: 500,
          Input: CONFIG.input,
          Result_url: null,
          Error: err.message
        },
        null,
        2
      )
    );
  }
}

module.exports = { screenshotWeb, main };
