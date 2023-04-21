"use strict";

const AWS = require("aws-sdk");
const sequelize = require("../lib/database");
const socketServices = require("../services/socket");
const userServices = require("../services/users");
const familyServices = require("../services/families");
const _ = require("lodash");
const util = require("util");
// const { default: retryAsPromised } = require("retry-as-promised");

// const successfullResponse = {
//   statusCode: 200,
//   body: "Success",
// };

// const failedResponse = (statusCode, error) => ({
//   statusCode,
//   body: error,
// });
sequelize.sync();
module.exports.connectHandler = async (event, context, callback) => {
//   try {
    //console.log("======connected");
    //callback(null, successfullResponse)
    // console.log(event.requestContext);
    // //callback(null, {...successfullResponse, id: event.requestContext.connectionId})
    //const t = await sequelize.transaction();
    //let obj = {endpoint: util.format(util.format('https://%s/%s', event.requestContext.domainName, event.requestContext.stage))};
    // let obj = {
    //   endpoint:
    //     event.requestContext.domainName + "/" + event.requestContext.stage,
    // };
    // let socketObj = await socketServices.getSocketConnection();
    // if (socketObj) {
    //   console.log("inside if=======");
    //   await socketServices.updateSocketConnection(obj, socketObj.id);
    //   //callback(null, successfullResponse);
    // } else {
    //   console.log("inside else======");
    //   await socketServices.createSocketConnection(obj);
    //   //callback(null, successfullResponse);
    // }
    // //return event
    // console.log("ending======================");
    // return {status: 200, body:"connected"}
//   } catch (err) {
//     console.log(err);
//     callback(failedResponse(500, JSON.stringify(err)));
//   }
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

  try {
    let obj = {endpoint: util.format(util.format('https://%s/%s', event.requestContext.domainName, event.requestContext.stage))};
    console.log('====',obj)
    let socketObj = await socketServices.getSocketConnection();
    if (socketObj) {
      console.log("inside if=======");
      await socketServices.updateSocketConnection(obj, socketObj.id);
      //callback(null, successfullResponse);
    } else {
      console.log("inside else======");
      await socketServices.createSocketConnection(obj);
      //callback(null, successfullResponse);
    }
    console.log('connected=====')
    return {
      statusCode: 200,
      body: 'Connected.',
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 200,
      body: 'Oops! Something Went Wrong.',
    };
  }
};

module.exports.disconnectHandler = (event, context, callback) => {
  try {
    console.log("disconnect===");
    return {status: 200, body:"disconnected"}
  }
    catch (error) {
      console.log(error);
      return {
        statusCode: 200,
        body: 'Oops! Something Went Wrong.',
      };
    }
    //callback(null, successfullResponse);
//   } catch (err) {
//     console.log(err);
//     callback(failedResponse(500, JSON.stringify(err)));
//   }
  //   socketServices.deleteSocketConnection(event.requestContext.connectionId)
  //     .then(() => {
  //       callback(null, successfullResponse)
  //     })
  //     .catch((err) => {
  //       console.log(err)
  //       callback(failedResponse(500, JSON.stringify(err)))
  //     })
};

module.exports.defaultHandler = async (event, context, callback) => {
  try {
    console.log("default==================",event);
    console.log(event?.requestContext?.connectionId);
    //callback(null, successfullResponse)

    // console.log(util.format(util.format('https://%s/%s', event.requestContext.domainName, event.requestContext.stage)));
    const t = await sequelize.transaction();
    let { family_member_id, user_id } = JSON.parse(event?.body);
    let updateObj = {
      socket_connection_id: event?.requestContext?.connectionId,
    };
    if (family_member_id) {
        console.log('if=========')
      updateObj = { ...updateObj, family_member_id: family_member_id };
      await familyServices.editFamily(updateObj, t);
      await t.commit();
      //callback(null, successfullResponse);
    } else {
        console.log('else========')
      updateObj = { ...updateObj, user_id: user_id };
      await userServices.editUserProfile(
        updateObj,
        _.omit(updateObj, ["user_id"]),
        t
      );
      await t.commit();
      //callback(null, successfullResponse);
    }
    await t.rollback();
    return {status: 200, body:"default"}

}
catch (error) {
  console.log(error);
  return {
    statusCode: 200,
    body: 'Oops! Something Went Wrong.',
  };
}
};

module.exports.sendMessageHandler = (event, context, callback) => {
try {
    console.log("send===", event, context);
    return {status: 200, body:"message"}
    //callback(null, successfullResponse);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 200,
      body: 'Oops! Something Went Wrong.',
    };
  }

  //   sendMessageToAllConnected(event)
  //     .then(() => {
  //       callback(null, successfullResponse)
  //     })
  //     .catch((err) => {
  //       callback(failedResponse(500, JSON.stringify(err)))
  //     })
};

// const sendMessageToAllConnected = (event) => {
//     console.log('calling====',)
//     return true
// //   return getAllConnections().then((connectionData) => {
// //     return connectionData.Items.map((connectionId) => {
// //       return send(event, connectionId.connectionId)
// //     })
// //   })
// }
