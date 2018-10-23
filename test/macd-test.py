import sys
sys.path.insert(0, '/Users/ericfoard/code/finance/bittrex/lib') # location of src

import macd

def main():
    macd.should_trade('/Users/ericfoard/code/finance/bittrex/test/data/BTC-BRK-prices.json', 'buy', 'BTC', False)

if __name__ == '__main__':
    main()
