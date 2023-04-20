const connectToDatabase = require('../models/index');
const AWS = require('aws-sdk');
AWS.config.update({ region:'us-west-1' , region: "localhost",});
require('aws-sdk/clients/apigatewaymanagementapi');

module.exports = {

  createSocketConnection: async (obj) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionCreated = await SocketConnection.create(obj);
    return connectionCreated;
  },

  updateSocketConnection: async(id, updateObj) => {
    console.log('update socket=====')
    const { SocketConnection } = await connectToDatabase();
    let connectionUpdated = await SocketConnection.update(updateObj, { where: {id: id} });
    return connectionUpdated;
  },

  getSocketConnection: async(url) => {
    console.log('get socket======')
    const { SocketConnection } = await connectToDatabase();
    let connectionObj = await SocketConnection.findOne({ where: {endpoint: url}, raw: true });
    return connectionObj;
  },

  deleteSocketConnection: async(id) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionObj = await SocketConnection.destroy({ where: {id: id} });
    return connectionObj;
  },

  displayNotification: async(event, connectionId) => {
    const body = JSON.parse(event.body);
    //const postData = body.data;
    const endpont = event.requestContext.domainName + "/" + event.requestContext.stage;
    const apiwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpont: endpont
    })
    const params = {
        connectionId: connectionId,
        Data: JSON.stringify({message: "Live starem is started", display_notification: true})
    }
    await apiwManagementApi.postToconnection(params).promise();
    return {
      statusCode: 200,
      body: params,
    };
},

getSocketCallbackUrl: async() => {
  const { SocketConnection } = await connectToDatabase();
  let connectionObj = await SocketConnection.findOne({ attributes: ["endpoint"], raw: true });
  return connectionObj;
},

displayNotification1: async(endpoint, connectionId) => {
  try{
  console.log('calling------------------------')
  const params = {
      ConnectionId: connectionId,
      Data: JSON.stringify({message: "Live starem is started", display_notification: true})
  }
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: endpoint
  })

  return apigwManagementApi.postToConnection(params).promise()
}
 catch(err){
  console.log(err)
 }
}
};
