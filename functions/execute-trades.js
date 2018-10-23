const bittrex = require('../lib/bittrex');
const BPromise = require('bluebird');

const BUY = 'buy';
const SELL = 'sell';
const ASSET_SLOTS = Number(process.env.ASSET_SLOTS);
const BASE_CURRENCY = 'BTC';

const resolveCurrency = market => market.split('-').pop();

const handleSell = sellTarget => {
  console.log('handle sell....');
  const currency = resolveCurrency(sellTarget.market);
  return BPromise.props({
    balance: bittrex.getBalance(currency),
    price: bittrex.getLatestPrice(sellTarget.market)
  })
  .then(resp => {
    // TODO: check for errors here?
    return bittrex.placeOrder(SELL, sellTarget.market, {
      quantity: resp.balance.Balance,
      price: resp.price[0].Bid
    })
  });
};

const handleSells = event => {
  const promises = event.markets.map(m => handleSell({ market: m }));
  return BPromise.all(promises); // TODO: use props?
};

// based on event.assetSlots & BTCBalance, calc amount to use in buy
// get latest price for buyTarget
// calc quantity to purchase
// execute buy call
const handleBuy = (event, buyTarget, opts) => {
  const fractionOfFundsToUse = 1 / opts.availableSlots;
  return bittrex.getLatestPrice(buyTarget.market)
  .then(resp => {
    const assetPrice = resp[0] && resp[0].Ask;
    return bittrex.placeOrder(BUY, buyTarget.market, {
      quantity: (opts.baseCurrencyQty / assetPrice) * fractionOfFundsToUse,
      price: assetPrice
    })
  });
};

const countAssetsHeld = (assets, event) => {
  return assets.filter(a => {
    return (a.Currency !== event.baseCurrency) && a.Balance;
  }).length;
};

// get BTC balances
// based on balances & number of asset slots, take first k elements of event.markets
const handleBuys = event => {
  return bittrex.getBalances()
  .then(assets => {
    const availableSlots = ASSET_SLOTS - countAssetsHeld(assets, event);
    const targetMarkets = event.markets.slice(0, availableSlots);
    if (!targetMarkets.length) {
      return {
        message: 'no target markets for buy action',
        event,
        assets
      };
    }
    const baseCurrencyHeld = assets.find(a => a.Currency === BASE_CURRENCY);
    const baseCurrencyQty = baseCurrencyHeld && baseCurrencyHeld.Balance;
    if (!baseCurrencyQty) {
      return {
        message: 'no funds available to use for buy',
        event,
        assets
      };
    }
    const promises = targetMarkets.map(m =>
      handleBuy(event, { market: m }, {
        availableSlots,
        baseCurrencyQty
      })
    );
    return BPromise.all(promises); // TODO: use props?
  });
};

exports.handler = (event, context, callback) => {
  if (!(event && event.found_trades && event.markets && event.markets.length)) {
    return callback(null, `no trades to be executed. Event received: ${event}`);
  }
  let handler;
  if (event.action === SELL) {
    handler = handleSells;
  }
  else if (event.action === BUY) {
    handler = handleBuys;
  }
  if (!handler) {
    return callback(new Error(`received unsupported action: ${event}`));
  }
  return handler(event)
  .then(resp => {
    console.log(`done in execute trades ${JSON.stringify(resp, null, 2)}`);
    return callback(null, resp);
  })
  .catch(err => {
    console.log(`err in execute trades ${JSON.stringify(err, null, 2)}`);
    return callback(err)
  });
};
