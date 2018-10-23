# call bittrex to get all markets
# for each market do the following

# get corresponding time series from s3
    # if DNE, exit
# check to see if time series has enough data to trade
    # if not, exit
# call macd module
# loop over all results and find ones where trades are found
import os
import sys
CWD = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, os.path.join(CWD, 'py-lib'))
# the above 4 lines allow libraries from /lib folder to be imported

import time
import hmac
import hashlib
import requests
import macd

API_KEY = ''
API_SECRET = ''
ASSET_SLOTS = os.environ['ASSET_SLOTS']

def __should_trade(action, market, s3client):
    json_timeseries = s3client.get_object(
    Bucket='efoard-bittrex-prices',
    Key='{}-prices.json'.format(market)
    )['Body'].read()
    return macd.should_trade(json_timeseries, action, market, False)

def __format_trade_results(action, trades):
    found_trades = bool(len(trades))
    prioritized_trades = sorted(trades, key=lambda t: t['priority'], reverse=True)
    print 'prioritized_trades {}'.format(prioritized_trades)
    markets = map(lambda m: m['market'], prioritized_trades)
    return {'action': action, 'found_trades': found_trades, 'markets': markets}

def __buy_markets():
    markets = requests.get('https://bittrex.com/api/v1.1/public/getmarkets').json()
    markets_count = len(markets['result'])
    if markets_count <= 0:
        print 'no markets found for trading: {}'.format(markets)

    active_markets = filter(lambda m: m['IsActive'], markets['result'])
    market_names = map(lambda m: m['MarketName'], active_markets)
    btc_markets_names = filter(lambda m: m.startswith('BTC'), market_names)
    return btc_markets_names

def __headers(url):
    apisign = hmac.new(API_SECRET, url, hashlib.sha512).hexdigest()
    return {'apisign': apisign}

def __markets_held():
    nonce = time.time()
    url = 'https://bittrex.com/api/v1.1/account/getbalances?apikey={}&nonce={}'.format(API_KEY, nonce)
    headers = __headers(url)
    balances = requests.get(url, headers=headers).json()
    held_assets = filter(lambda b: bool(b['Balance']) and b['Currency'] != 'BTC', balances['result'])
    btc_markets_names = map(lambda c: 'BTC-{}'.format(c['Currency']),held_assets)
    return btc_markets_names

def find(action, s3client):
    btc_markets_names = []
    if action == 'sell':
        btc_markets_names = __markets_held()
    if action == 'buy' and (len(__markets_held()) < int(ASSET_SLOTS)-1): # -1 because BTC filtered out
        btc_markets_names = __buy_markets()

    print 'checking markets for {}: {}'.format(action, btc_markets_names)
    print 'ASSET_SLOTS: {}'.format(ASSET_SLOTS)

    trade_analysis_results = map(lambda m: __should_trade(action, m, s3client), btc_markets_names)
    trades = filter(lambda t: t['should_trade'], trade_analysis_results)
    formatted_trade_results = __format_trade_results(action, trades)
    print 'trade results {}'.format(formatted_trade_results)
    return formatted_trade_results
