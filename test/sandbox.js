event = {
  "action": "sell",
  "foundTrades": true,
  "baseCurrency": "BTC",
  "assetSlots": 2,
  "markets": [
    //{"market":"BTC-GRS"},
    //{"market":"BTC-CURE"}
    {"market":"BTC-ION"}
  ]
};
const trade = require('../functions/execute-trades');
const bittrex = require('../lib/bittrex');

// trade.handler(event, null, (err, resp) => {
//   if (err) console.log('DONE ERR!!!',err);
//   else console.log('DONE!!!', resp);
// })

bittrex.getOpenOrders().then(resp => console.log(resp)).catch(err => console.log(err));

// bittrex.getBalance('BTC').then(resp => console.log(resp)).catch(err => console.log(err));
// //
// console.log('placing sell order...');
// bittrex.placeOrder('sell', 'BTC-CURE', {
//   quantity: 89.43331705,
//   price: 0.00003855
// })
// .then(resp => {
//   console.log('getting open orders...');
//   return bittrex.getOpenOrders()
// })
// .then(resp => console.log(resp)).catch(err => console.log(err));
