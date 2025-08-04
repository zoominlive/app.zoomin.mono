const { connections } = require('../websocket-server');

const socketServices = {
  emitResponse: async (connectionId, message) => {
    try {
      const ws = connections.get(connectionId);
      if (ws && ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(message));
        console.log(`Message sent to ${connectionId}`);
      } else {
        console.log(`Connection ${connectionId} not found or not open`);
        // Clean up in database if needed
      }
    } catch (err) {
      console.error("emitResponse error:", err);
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
  },

  // Broadcast to all connected clients
  broadcast: (message) => {
    connections.forEach((ws, connectionId) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(message));
      }
    });
  },

  // Get connection count
  getConnectionCount: () => {
    return connections.size;
  }
};

module.exports = socketServices;
