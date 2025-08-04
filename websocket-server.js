const WebSocket = require('ws');
const { sequelize } = require('./lib/database');
const userServices = require("./services/users");
const familyServices = require("./services/families");
const _ = require("lodash");
const { emitResponse } = require("./services/socket");

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: process.env.WEBSOCKET_PORT || 3001
  // Removed path restriction to allow connections from any path
});

console.log(`WebSocket server started on port ${process.env.WEBSOCKET_PORT || 3001}`);

// Store active connections
const connections = new Map();

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
  const connectionId = generateConnectionId();
  connections.set(connectionId, ws);
  
  console.log(`New WebSocket connection: ${connectionId} from ${req.socket.remoteAddress}`);
  
  // Set up ping/pong to keep connection alive
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Send connection confirmation
  try {
    ws.send(JSON.stringify({
      type: 'connection',
      connectionId: connectionId,
      message: 'Connected successfully'
    }));
  } catch (error) {
    console.error('Error sending connection confirmation:', error);
  }

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      // Handle raw string messages (like 'ping')
      if (typeof data === 'string' || data.toString().trim() === 'ping') {
        ws.send(JSON.stringify({ message: 'pong' }));
        return;
      }
      
      // Handle JSON messages
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      // Handle ping/pong
      if (message === 'ping' || message.message === 'ping') {
        ws.send(JSON.stringify({ message: 'pong' }));
        return;
      }
      
      // Handle user/family member registration
      if (message.family_member_id || message.user_id) {
        const t = await sequelize.transaction();
        try {
          let updateObj = {
            socket_connection_id: connectionId,
          };
          
          if (message.family_member_id) {
            updateObj = { ...updateObj, family_member_id: message.family_member_id };
            await familyServices.editFamily(updateObj, t);
          } else {
            updateObj = { ...updateObj, user_id: message.user_id };
            await userServices.editUserProfile(
              updateObj,
              _.omit(updateObj, ["user_id"]),
              t
            );
          }
          
          await t.commit();
          ws.send(JSON.stringify({ 
            type: 'registration_success',
            message: 'Registration successful' 
          }));
        } catch (error) {
          await t.rollback();
          console.error('Registration error:', error);
          ws.send(JSON.stringify({ 
            type: 'error',
            message: 'Registration failed' 
          }));
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      // Don't send error response for malformed messages to avoid connection issues
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${connectionId} with code: ${code} reason: ${reason}`);
    connections.delete(connectionId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
    connections.delete(connectionId);
  });
});

// Set up heartbeat to detect stale connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating stale connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(interval);
});

// Generate unique connection ID
function generateConnectionId() {
  return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Export for use in other modules
module.exports = {
  wss,
  connections,
  generateConnectionId
}; 