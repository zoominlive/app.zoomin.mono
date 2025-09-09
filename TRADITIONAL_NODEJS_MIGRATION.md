# Migration from Serverless to Traditional Node.js

This document outlines the changes made to migrate from AWS Serverless to traditional Node.js implementation.

## Changes Made

### 1. WebSocket Implementation

**Before (Serverless):**
- Used AWS API Gateway WebSocket API
- Handlers in `websocket/handler.js`
- AWS SDK for sending messages

**After (Traditional Node.js):**
- WebSocket server using `ws` library
- Server in `websocket-server.js`
- Direct WebSocket connections

**Key Files:**
- `websocket-server.js` - WebSocket server implementation
- `services/socket.js` - Updated to work with traditional WebSocket
- `test-websocket.js` - Test client for WebSocket functionality

### 2. Cron Jobs Implementation

**Before (Serverless):**
- AWS EventBridge scheduled events
- Lambda functions triggered by cron expressions
- Functions in `cron.js`

**After (Traditional Node.js):**
- `node-cron` library for scheduling
- Scheduler in `cron-scheduler.js`
- Same cron job logic from `cron.js`

**Key Files:**
- `cron-scheduler.js` - Cron job scheduler
- `cron.js` - Cron job functions (unchanged)

### 3. Server Integration

**Updated Files:**
- `server.js` - Now imports WebSocket server and cron scheduler
- `package.json` - Added `ws` and `node-cron` dependencies

## New Dependencies

```json
{
  "ws": "^8.13.0",
  "node-cron": "^3.0.2"
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
WEBSOCKET_PORT=3001
NODE_ENV=development
```

### WebSocket Configuration

- Default port: 3001
- Path: `/websocket`
- Supports ping/pong for health checks
- Handles user and family member registration

### Cron Job Schedule

- **disableScheduledUsers**: Every hour at minute 0
- **enableScheduledChild**: Every hour at minute 0  
- **enableDisableScheduledZone**: Every hour at minute 0

## Usage

### Starting the Server

```bash
npm start
```

This will start:
1. Express HTTP server (port 3000)
2. WebSocket server (port 3001)
3. Cron job scheduler

### Testing WebSocket

```bash
node test-websocket.js
```

### Manual Cron Job Triggering

```javascript
const cronScheduler = require('./cron-scheduler');

// Manually trigger jobs
await cronScheduler.triggerDisableScheduledUsers();
await cronScheduler.triggerEnableScheduledChild();
await cronScheduler.triggerEnableDisableScheduledZone();
```

## Migration Benefits

1. **Simplified Architecture**: No AWS Lambda cold starts
2. **Better Performance**: Direct WebSocket connections
3. **Easier Debugging**: Local development without AWS
4. **Cost Effective**: No AWS Lambda charges
5. **Real-time Communication**: Lower latency WebSocket connections

## Backward Compatibility

The existing API endpoints remain unchanged. Only the WebSocket and cron job implementations have been migrated.

## Monitoring

- WebSocket connections are logged
- Cron job executions are logged
- Error handling for both WebSocket and cron jobs

## Development vs Production

- **Development**: Additional test cron jobs every 5 minutes
- **Production**: Standard hourly cron jobs only

## Troubleshooting

### WebSocket Issues
1. Check if port 3001 is available
2. Verify WebSocket client connects to correct URL
3. Check server logs for connection errors

### Cron Job Issues
1. Verify database connections
2. Check timezone settings (UTC)
3. Review cron job logs for errors

### General Issues
1. Ensure all dependencies are installed: `npm install`
2. Check environment variables are set correctly
3. Verify database connectivity 