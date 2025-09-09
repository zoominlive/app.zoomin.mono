const WebSocket = require('ws');

// Test WebSocket client
function testWebSocket() {
  const ws = new WebSocket('ws://localhost:3001/websocket');
  
  ws.on('open', () => {
    console.log('Connected to WebSocket server');
    
    // Test ping
    ws.send('ping');
    
    // Test user registration
    setTimeout(() => {
      ws.send(JSON.stringify({
        user_id: 'test_user_123',
        family_member_id: null
      }));
    }, 1000);
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received:', message);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
}

// Run test if this file is executed directly
if (require.main === module) {
  console.log('Testing WebSocket connection...');
  testWebSocket();
}

module.exports = { testWebSocket }; 