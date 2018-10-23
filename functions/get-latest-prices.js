// TODO: don't write prices for inactive markets
'use strict';
const bittrex = require('../lib/bittrex');
const s3 = require('../lib/s3');
const BPromise = require('bluebird');

const priceAlreadyRecorded = (newPrice, priceHistory) => {
  return newPrice.TimeStamp &&
  priceHistory[priceHistory.length-1] &&
  priceHistory[priceHistory.length-1].TimeStamp &&
  priceHistory[priceHistory.length-1].TimeStamp === newPrice.TimeStamp;
}

const updatePriceHistory = (priceData) => {
  return s3.getPriceHistory(priceData.MarketName)
  .then(history => {
    const priceHistory = Array.isArray(history) ? history : [];
    const newPrice = priceData; //bittrex.format(priceData);
    if (priceAlreadyRecorded(newPrice, priceHistory)) {
      console.log({
        message: 'price history already contains entry',
        payload: newPrice
      });
      return priceHistory;
    }
    console.log({
      message: 'adding entry to price history',
      payload: newPrice
    });
    priceHistory.push(newPrice);
    return s3.updatePriceHistory(priceHistory, priceData.MarketName);
  });
}

const updatePriceHistories = (prices) => {
  return BPromise.map(prices, p => updatePriceHistory(p), { concurrency: 20 });
};

exports.handler = (event, context, callback) => {
  if (!(event && event.market)) {
    return new Error(`must specify trading market`);
  }
  return bittrex.getLatestPrices(event.market)
  .then(prices => updatePriceHistories(prices))
  .then(resp => {
    console.log('completed get-latest-prices');
    callback(null, 'success')
  })
  .catch(err => callback(err));
};
