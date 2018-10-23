const axios = require('axios');
const qs = require('querystring');
const crypto = require('crypto');

const URL = 'https://bittrex.com/api/v1.1';
const API_KEY = '';
const API_SECRET = '';
const BUFFER = 0.03;
const BUY = 'buy';
const routes = {
  getMarketSummaries: '/public/getmarketsummaries',
  getMarketSummary: '/public/getmarketsummary',
  getBalance: '/account/getbalance',
  getBalances: '/account/getbalances',
  getOpenOrders: '/market/getopenorders',
  CancelOpenOrder: '/market/cancel',
  sell: '/market/selllimit',
  buy: '/market/buylimit',
  getOrderHistory: '/account/getorderhistory'
}

const headers = (url) => ({
    apisign : crypto.createHmac('sha512', API_SECRET).update(url).digest('hex')
});

// TODO: should I leverage the 'success' flag to look for errors
const handleResponse = (resp, route, market) => {
  if (!(resp && resp.data && resp.data.result)) {
    return new Error(`error calling ${route} for ${market}: ${JSON.stringify(resp.data, null, 2)}`);
  }
  return resp.data.result;
};

const formatqs = params => `?${qs.stringify(params)}`;

const placeOrder = (orderType, market, opts) => {
  const route = routes[orderType.toLowerCase()];
  const queryParams = {
    apikey: API_KEY,
    market, market,
    nonce: new Date().getTime(),
    quantity: opts.quantity - (orderType == BUY ? (opts.quantity * BUFFER) : 0), // TODO: dynamic buffer?
    rate: opts.price
  };
  console.log('order!!!',queryParams);
  const url = `${URL}${route}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, route, market));
};

const getBalances = () => {
  const queryParams = {
    apikey: API_KEY,
    nonce: new Date().getTime()
  };
  const url = `${URL}${routes.getBalances}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.getBalances, 'balances'))
};

const getBalance = currency => {
  const queryParams = {
    apikey: API_KEY,
    currency: currency,
    nonce: new Date().getTime()
  };
  const url = `${URL}${routes.getBalance}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.getBalance, currency))
};

const getLatestPrices = market => {
  return axios.get(`${URL}${routes.getMarketSummaries}`)
  .then(resp => {
    if (!(resp && resp.data && resp.data.result)) {
      return new Error(`insufficent data returned from ${routes.getMarketSummaries} for market ${market}`);
    }
    if (!market) {
      return resp.data.result;
    }
    const targetMarket = market.toUpperCase();
    return resp.data.result.filter(e => e.MarketName.startsWith(targetMarket));
  })
};

const getLatestPrice = market => {
  const queryParams = {
    apikey: API_KEY,
    market,
    nonce: new Date().getTime()
  };
  const url = `${URL}${routes.getMarketSummary}${formatqs(queryParams)}`;
  console.log('getting latest price...', url);
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.getMarketSummary, market))
};

const getOpenOrders = () => {
  const queryParams = {
    apikey: API_KEY,
    nonce: new Date().getTime()
  };
  const url = `${URL}${routes.getOpenOrders}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.getOpenOrders, 'getOpenOrders'))
};

const CancelOpenOrder = OrderUuid => {
  const queryParams = {
    apikey: API_KEY,
    nonce: new Date().getTime(),
    uuid: OrderUuid
  };
  const url = `${URL}${routes.CancelOpenOrder}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.CancelOpenOrder, OrderUuid))
}

const getOrderHistory = () => {
  const queryParams = {
    apikey: API_KEY,
    nonce: new Date().getTime()
  };
  const url = `${URL}${routes.getOrderHistory}${formatqs(queryParams)}`;
  return axios.get(url, {
    headers: headers(url)
  })
  .then(resp => handleResponse(resp, routes.getOrderHistory, 'getOrderHistory'))
}

const format = (payload) => ({
  timestamp: payload.TimeStamp,
  price: payload.Last,
  market: payload.MarketName
});

module.exports = {
  getLatestPrices,
  getLatestPrice,
  placeOrder,
  getBalance,
  getBalances,
  getOpenOrders,
  CancelOpenOrder,
  getOrderHistory,
  format
};
