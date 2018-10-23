const AWS = require('aws-sdk');

AWS.config.region = 'us-west-2';
const stepfunctions = new AWS.StepFunctions();

const listStateMachines = () => {
  return new Promise((resolve, reject) => {
    stepfunctions.listStateMachines({}, (err, data) => {
      if (err) {
        console.log('err getting state machines ', err);
        return reject(err);
      }
      console.log('got state machines ', data);
      return resolve(data);
    });
  });
};

const listExecutions = (machineARN) => {
  console.log('getting executions for state machine ', machineARN);
  return new Promise((resolve, reject) => {
    const params = {
      stateMachineArn: machineARN,
      statusFilter: 'RUNNING'
    };
    stepfunctions.listExecutions(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`got executions for state machine ${machineARN}: ${JSON.stringify(data, null, 2)}`);
      return resolve(data);
    });
  });
};

exports.handler = (event, context, callback) => {
  let machineARN = ''
  return listStateMachines()
  .then(resp => {
    machineARN = (resp.stateMachines && resp.stateMachines[0] && resp.stateMachines[0].stateMachineArn) || '';
    return listExecutions(machineARN);
  })
  .then(resp => {
    const executions = (resp.executions || []).filter(e => e.stateMachineArn === machineARN);
    return callback(null, {
      openExecutionsCount: executions.length
    });
  })
  .catch(err => {
    console.log('error getting step function executions: ', err);
    return callback(err);
  })
};
