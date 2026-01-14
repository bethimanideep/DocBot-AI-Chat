# Socket Service

A dedicated Socket.IO service for tracking active users in DocBot AI Chat.

## Features

- Real-time active user tracking
- WebSocket connections with Socket.IO
- Health check endpoint
- Active users count endpoint
- Room support for future features
- Graceful shutdown handling

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3002
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Health Check
- `GET /health` - Check if service is running and get active users count

### Active Users Count
- `GET /active-users` - Get current active users count

## Socket.IO Events

### Client to Server Events

#### Connection
- Automatically handled when client connects

#### `join-room`
```javascript
socket.emit('join-room', 'room-name');
```

#### `leave-room`
```javascript
socket.emit('leave-room', 'room-name');
```

#### `user-activity`
```javascript
socket.emit('user-activity', {
  type: 'typing',
  data: 'User is typing...'
});
```

### Server to Client Events

#### `active-users-update`
```javascript
socket.on('active-users-update', (data) => {
  console.log('Active users:', data.count);
  console.log('Timestamp:', data.timestamp);
});
```

#### `user-activity-broadcast`
```javascript
socket.on('user-activity-broadcast', (data) => {
  console.log('User activity:', data);
});
```

## Usage

Start the service:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Client Integration

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('Connected to socket service');
});

socket.on('active-users-update', (data) => {
  console.log('Active users:', data.count);
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket service');
});
```

## Deployment

This service is designed to be deployed separately from the main application for better performance and scaling. It can be deployed on platforms like Render, Heroku, or any Node.js hosting service.

## Monitoring

The service provides built-in logging for:
- User connections/disconnections
- Active user count changes
- Socket errors
- Server status
