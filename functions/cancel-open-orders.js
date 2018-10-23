const bittrex = require('../lib/bittrex');
const BPromise = require('bluebird');

exports.handler = (event, context, callback) => {
  console.log('in cancel-open-orders!!!!!!', event);
  return bittrex.getOpenOrders()
  .then(orders => {
    const promises = orders.map(o => bittrex.CancelOpenOrder(o.OrderUuid));
    return BPromise.all(promises);
  })
  .then(resp => {
    console.log('orders cancelled success!', resp);
    return callback(null, resp);
  })
  .catch(err => {
    console.log('error cancelling open orders!', err);
    return callback(err);
  });
};
