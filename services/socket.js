const AWS = require("aws-sdk");
require("aws-sdk/clients/apigatewaymanagementapi");

const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: process.env.websocket_endpoint
});

const socketServices = {
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

  // Send notification to multiple users
  emitToUsers: async (userIds, message) => {
    try {
      const { Users, Family } = await require('../models/index')();
      
      // Get users with socket connections
      const users = await Users.findAll({
        where: {
          user_id: userIds,
          socket_connection_id: {
            [require('sequelize').Op.ne]: null
          }
        },
        attributes: ['user_id', 'socket_connection_id', 'first_name', 'last_name']
      });

      // Get family members with socket connections
      const familyMembers = await Family.findAll({
        where: {
          family_member_id: userIds,
          socket_connection_id: {
            [require('sequelize').Op.ne]: null
          }
        },
        attributes: ['family_member_id', 'socket_connection_id', 'first_name', 'last_name']
      });

      // Send notifications to users
      for (const user of users) {
        if (user.socket_connection_id) {
          await socketServices.emitResponse(user.socket_connection_id, message);
        }
      }

      // Send notifications to family members
      for (const member of familyMembers) {
        if (member.socket_connection_id) {
          await socketServices.emitResponse(member.socket_connection_id, message);
        }
      }

      console.log(`Recording share notifications sent to ${users.length + familyMembers.length} recipients`);
    } catch (err) {
      console.error("emitToUsers error:", err);
    }
  },

  // Send recording share notification
  sendRecordingShareNotification: async (recipientId, senderName, recordingDetails) => {
    console.log(`🔔 Attempting to send recording share notification:`);
    console.log(`   - Recipient ID: ${recipientId}`);
    console.log(`   - Sender Name: ${senderName}`);
    console.log(`   - Recording Details:`, recordingDetails);
    
    const notification = {
      type: "recording_shared",
      message: `${senderName} has shared a recording with you`,
      recording: recordingDetails,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending notification:`, notification);
    
    try {
      await socketServices.emitToUsers([recipientId], notification);
      console.log(`✅ Recording share notification sent successfully to ${recipientId}`);
    } catch (error) {
      console.error(`❌ Failed to send recording share notification to ${recipientId}:`, error);
      throw error;
    }
  }
};

module.exports = socketServices;
