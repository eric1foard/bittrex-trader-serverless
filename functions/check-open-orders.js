const bittrex = require('../lib/bittrex');

function OpenOrdersError(message) {
  this.name = 'OpenOrdersError';
  this.message = message;
};
OpenOrdersError.prototype = new Error();

exports.handler = (event, context, callback) => {
  return bittrex.getOpenOrders()
  .then(orders => {
    const ordersStr = JSON.stringify(orders, null, 2);
    console.log(`found open orders: ${ordersStr}`);
    if (orders && orders.length) {
      return callback(new OpenOrdersError(ordersStr));
    }
    return callback(null, orders);
  })
  .catch(err => {
    console.log(`error getting open orders: ${JSON.stringify(err, null, 2)}`);
    return callback(err);
  })
};
