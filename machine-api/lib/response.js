const META = {
  creator: "XYCoolcraft",
  developer: "XYCoolcraft",
  version: "v1.0.0"
};

function success(data, extra) {
  return Object.assign({
    status: true,
    code: 200,
    ...META,
    result: data,
    time: new Date().toISOString()
  }, extra || {});
}

function failure(message, code) {
  return {
    status: false,
    code: code || 500,
    ...META,
    error: message,
    time: new Date().toISOString()
  };
}

module.exports = { success, failure, META };
