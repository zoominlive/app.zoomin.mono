const AWS = require("aws-sdk");
require("aws-sdk/clients/apigatewaymanagementapi");

const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: process.env.websocket_endpoint
});

module.exports = {
  emitResponse: async (connectionId, message) => {
    try {
      await apiGatewayManagementApi.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      }).promise();
      console.log(`Message sent to ${connectionId}`);
    } catch (err) {
      console.error("emitResponse error:", err);
  
      if (err.statusCode === 410) {
        console.log(`Stale connection detected: ${connectionId}`);
        // Clean up in database if needed
      }
      // You could choose to throw if you want lambda to know sending failed
      // throw err;
    }
  },
};
