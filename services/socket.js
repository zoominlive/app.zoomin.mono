const connectToDatabase = require('../models/index');
const AWS = require('aws-sdk');
require('aws-sdk/clients/apigatewaymanagementapi');

module.exports = {

  createSocketConnection: async (Obj, t) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionCreated = await SocketConnection.create(Obj, { transaction: t });
    return connectionCreated;
  },

  updateSocketConnection: async(id, updateObj, t) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionUpdated = await SocketConnection.update(updateObj, { where: {connection_id: id} }, { transaction: t });
    return connectionUpdated;
  },

  getSocketConnection: async(id, t) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionObj = await SocketConnection.findOne({ where: {connection_id: id}, raw: true }, { transaction: t });
    return connectionObj;
  },

  deleteSocketConnection: async(id, t) => {
    const { SocketConnection } = await connectToDatabase();
    let connectionObj = await SocketConnection.destroy({ where: {connection_id: id} }, { transaction: t });
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
},

getConnectionId: async(t) => {
  const { SocketConnection } = await connectToDatabase();
  let connectionObj = await SocketConnection.findOne({ attributes: ["connection_id"], raw: true }, { transaction: t });
  return connectionObj;
},

displayNotification1: async(connectionId) => {
  //const body = JSON.parse(event.body);
  //const postData = body.data;
  //const endpont = event.requestContext.domainName + "/" + event.requestContext.stage;
  const endpont = 'http://localhost:3000'
  const apiwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpont: endpont
  })
  const params = {
      connectionId: connectionId,
      Data: JSON.stringify({message: "Live starem is started", display_notification: true})
  }
  await apiwManagementApi.postToconnection(params).promise();
}
};
