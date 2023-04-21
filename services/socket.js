const AWS = require("aws-sdk");
require("aws-sdk/clients/apigatewaymanagementapi");

module.exports = {
  emitResponse: async (connectionId) => {
    console.log("=====", connectionId);
    let data = {
      message: "Live stream is started",
      display_notification: true,
    };
    new Promise((resolve, reject) => {
      const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint: process.env.websocket_endpoint
      });
      apiGatewayManagementApi.postToConnection(
        {
          ConnectionId: connectionId,
          Data: JSON.stringify(data),
        },
        (err, data) => {
          if (err) {
            console.log("emitResponse err is", err);
            // return reject(err);
          }
          return resolve(data);
        }
      );
    });
  },
};
