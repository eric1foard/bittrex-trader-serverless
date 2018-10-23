const bittrex = require('../lib/bittrex');
const moment = require('moment');
const AWS = require('aws-sdk');

AWS.config.region = 'us-west-2';

const hasRecentTrades = () => {
  return bittrex.getOrderHistory()
  .then(history => {
    const recentTradeWindow = moment().utc().subtract(3, 'minutes');
    console.log(recentTradeWindow);
    return history.filter(trade => {
      return moment.utc(trade.TimeStamp).isAfter(recentTradeWindow);
    })
  })
}

const notify = (trades) => {
  const ses = new AWS.SES();

  const body_html = `<html>
  <head></head>
  <body>
  <h1>Recent Bittrex Trades</h1>
  <pre>${JSON.stringify(trades, null, 2)}</pre>
  </body>
  </html>`;

  const charset = 'UTF-8';

  const params = {
    Source: 'Eric Foard <foard265@gmail.com>',
    Destination: {
      ToAddresses: [
        'foard265@gmail.com'
      ],
    },
    Message: {
      Subject: {
        Data: 'Recent Bittrex Trades',
        Charset: charset
      },
      Body: {
        Html: {
          Data: body_html,
          Charset: charset
        }
      }
    }
  };

  return new Promise((resolve, reject) => {
    ses.sendEmail(params, function(err, data) {
      if (err) {
        console.log(err.message);
        return reject(err);
      }
      console.log("Email sent! Message ID: ", data.MessageId);
      return resolve(data.MessageId);
    });
  });
};

exports.handler = (event, context, callback) => {
  hasRecentTrades()
  .then(trades => {
    let message = 'no recent trades';
    if (!trades.length) {
      console.log(message);
      return message;
    }
    return notify(trades);
  })
  .then(resp => {
    console.log('completed trade-notification: ', resp);
    return callback(null, resp);
  })
  .catch(err => {
    console.log('error in trade-notification: ', err);
    return callback(err);
  })
};
