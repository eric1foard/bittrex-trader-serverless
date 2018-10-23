import pandas as pd
# import matplotlib.pyplot as plt

PERIOD=288

def __read_json_to_df(json):
    prices = pd.read_json(path_or_buf=json)
    prices = prices.set_index('TimeStamp')
    return prices

def __ema(df, period):
    # return pd.ewma(df.resample('5T', fill_method='ffill')['price'], span=period)
    return pd.ewma(df['Last'], span=period)

def __plot(df):
    pass
    print df

# if latest macd price crosses below signal line it's a sell indicator
def __should_sell(df):
    NEW_ROW = -1
    LAST_ROW = -2
    # is latest macd value below signal line?
    latest_macd_value = df['macd'].values[NEW_ROW]
    latest_signal_value = df['signal'].values[NEW_ROW]
    latest_macd_below_signal = latest_macd_value < latest_signal_value
    # is previous macd value below signal line?
    prev_macd_value = df['macd'].values[LAST_ROW]
    prev_signal_value = df['signal'].values[LAST_ROW]
    prev_macd_below_signal = prev_macd_value < prev_signal_value
    # it's only a crossover if latest macd value is below signal and prev is not
    if latest_macd_below_signal and not prev_macd_below_signal:
        print 'found sell opportunity!'
        return True
    print 'no sell opportunity'
    return False
# def __should_sell(df):
#     NEW_ROW = -1
#     LAST_ROW = -2
#     latest_macd_value = df['macd'].values[NEW_ROW]
#     prev_macd_value = df['macd'].values[LAST_ROW]
#     if latest_macd_value <= prev_macd_value:
#         return True
#     return False

# else does newest data cause MACD to cross above signal line?
def __should_buy(df):
    NEW_ROW = -1
    LAST_ROW = -2
    price_increase_magnitude = 0
    # is latest macd above below signal line?
    latest_macd_value = df['macd'].values[NEW_ROW]
    latest_signal_value = df['signal'].values[NEW_ROW]
    latest_macd_above_signal = latest_macd_value > latest_signal_value
    # is previous macd value above signal line?
    prev_macd_value = df['macd'].values[LAST_ROW]
    prev_signal_value = df['signal'].values[LAST_ROW]
    prev_macd_above_signal = prev_macd_value > prev_signal_value
    # it's only a crossover if latest macd value is below signal and prev is not
    if latest_macd_above_signal and not prev_macd_above_signal:
        print 'found buy opportunity!'
        price_increase_magnitude = latest_macd_value / prev_macd_value
        return True, price_increase_magnitude
    return False, price_increase_magnitude

# read price data into dataframe
# calculate long period EMA
# calculate short period EMA
# subtract long period EMA from short period EMA (MACD)
# calculate 9 (?) period EMA of MACD (signal line)
# does newest data cause MACD to cross below signal line?
    # if so, return SELL
# else does newest data cause MACD to cross above signal line?
    # if so, return BUY
# else do nothing
def should_trade(json, action, market, show_plot):
    if not (action == 'buy' or action == 'sell'):
        print 'unsupported action passed to should_trade: {}'.format(action)
        return {'action': action, 'market': market, 'should_trade': False}

    result = None
    price_increase_magnitude = 0

    df = __read_json_to_df(json) # TODO: do I want to resample into 5T?
    rows, cols = df.shape
    if rows < 20 * PERIOD:
        print 'not enough data to trade {}'.format(market)
        return {'action': action, 'market': market, 'should_trade': False, 'priority': 0}

    df['long'] = __ema(df, 20 * PERIOD)
    df['short'] = __ema(df, (20/2) * PERIOD)
    df['macd'] = df['short'] - df['long']
    df['signal'] = pd.ewma(df['macd'], span=(20/3) * PERIOD)

    if action == 'sell':
        result = __should_sell(df)
    if action == 'buy':
        result, price_increase_magnitude = __should_buy(df)

    # print 'result of {} action for market {}: {}'.format(action, market, result)
    if show_plot:
        __plot(df)

    return {'action': action, 'market': market, 'should_trade': result, 'priority': price_increase_magnitude}

# if __name__ == '__main__':
#     should_trade()
