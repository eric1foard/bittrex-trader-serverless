const AWS = require('aws-sdk');
const Promise = require('bluebird');

AWS.config.region = 'us-west-2';
const s3 = new AWS.S3();

const s3Params = (market) => {
  const target = market.toUpperCase();
  return {
    Bucket: 'efoard-bittrex-prices',
    Key: `${market}-prices.json`
  }
};

// if object does not exist, s3 will throw AccessDenied exception
const objectDNE = (err) => err.code === 'AccessDenied';

const getPriceHistory = (market) => new Promise((resolve, reject) => {
  s3.getObject(s3Params(market), (err, resp) => {
    if (err) {
      if (objectDNE(err)) {
        return resolve([]);
      }
      return reject(err);
    }
    const prices = resp.Body.toString('utf-8');
    return resolve(JSON.parse(prices));
  })
});

const updatePriceHistory = (payload, market) => new Promise((resolve, reject) => {
  const params = Object.assign(s3Params(market), {
    Body: JSON.stringify(payload)
  });
  s3.putObject(params, (err, resp) => {
    if (err) {
      return reject(err);
    }
    return resolve(resp);
  });
});

module.exports = {
  updatePriceHistory,
  getPriceHistory
};
