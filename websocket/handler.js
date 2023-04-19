'use strict'

const AWS = require('aws-sdk')
const sequelize = require('../lib/database');
const socketServices = require('../services/socket');
const userServices = require('../services/users');
const familyServices = require('../services/families');
const _ = require('lodash');
const util = require('util');

const successfullResponse = {
  statusCode: 200,
  body: 'Success'
}

const failedResponse = (statusCode, error) => ({
  statusCode,
  body: error
})
sequelize.sync();
module.exports.connectHandler = async(event, context, callback) => {
  try{
    console.log("======connected")
    callback(null, successfullResponse)
    // console.log(event.requestContext);
    // //callback(null, {...successfullResponse, id: event.requestContext.connectionId})
    // const t = await sequelize.transaction();
    // //let obj = {endpoint: util.format(util.format('https://%s/%s', event.requestContext.domainName, event.requestContext.stage))};
    // let obj ={endpoint: event.requestContext.domainName + '/' + event.requestContext.stage}
    // let socketObj = await socketServices.getSocketConnection(obj.endpoint);
    // if(socketObj){
    //   await socketServices.updateSocketConnection(obj, socketObj.id, t)
    //   callback(null, {...successfullResponse, id: event.requestContext.connectionId})
    // }
    // else{
    //   await socketServices.createSocketConnection(obj, t)
    //   callback(null, {...successfullResponse, id: event.requestContext.connectionId})
    // }
  }
  catch(err){
    console.log(err)
    callback(failedResponse(500, JSON.stringify(err)))
  }
    // const t = await sequelize.transaction();
    // let obj = {connection_id: event.requestContext.connectionId};
    // console.log('========',obj)
    // //socketServices.getSocketConnection(event.requestContext.connectionId, t)
    // socketServices.createSocketConnection(obj, t)
    // .then(() => {
    //   console.log('inside then=======')
    //   callback(null, successfullResponse)
    // })
    // .catch((err) => {
    //   callback(failedResponse(500, JSON.stringify(err)))
    // })
}

module.exports.disconnectHandler = (event, context, callback) => {
  socketServices.deleteSocketConnection(event.requestContext.connectionId)
    .then(() => {
      callback(null, successfullResponse)
    })
    .catch((err) => {
      console.log(err)
      callback(failedResponse(500, JSON.stringify(err)))
    })
}

module.exports.defaultHandler = async(event, context, callback) => {
  console.log('default==================');
  callback(null, successfullResponse)
  // console.log(util.format(util.format('https://%s/%s', event.requestContext.domainName, event.requestContext.stage)));
  // const t = await sequelize.transaction();
  // let { family_member_id, user_id } = JSON.parse(event?.body)
  // let updateObj = { 
  //   socket_connection_id: event?.requestContext?.connectionId,
  // }
  // if(family_member_id){
  //   updateObj = {...updateObj, family_member_id: family_member_id}
  //   await familyServices.editFamily(updateObj, t);
  //   callback(null, successfullResponse)
  // }
  // else{
  //   updateObj = {...updateObj, user_id: user_id}
  //   await userServices.editUserProfile(updateObj, _.omit(updateObj, ['user_id']), t);
  //   callback(null, successfullResponse)
  // }
  
}

module.exports.sendMessageHandler = (event, context, callback) => {
  //console.log("send===",event, context)
  sendMessageToAllConnected(event)
    .then(() => {
      callback(null, successfullResponse)
    })
    .catch((err) => {
      callback(failedResponse(500, JSON.stringify(err)))
    })
}

const sendMessageToAllConnected = (event) => {
    console.log('calling====',)
    return true
//   return getAllConnections().then((connectionData) => {
//     return connectionData.Items.map((connectionId) => {
//       return send(event, connectionId.connectionId)
//     })
//   })
}





