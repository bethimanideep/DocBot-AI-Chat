const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Socket service is running', 
    timestamp: new Date().toISOString() 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Get active users count and emit to all clients
  const activeNow = io.of("/").sockets.size || io.sockets.sockets.size || 0;
  socket.emit("activeUsers", { count: activeNow });
  io.emit("activeUsers", { count: activeNow });
  
  console.log(`Active users: ${activeNow}`);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Get updated active users count and emit to all clients
    const activeNow = io.of("/").sockets.size || io.sockets.sockets.size || 0;
    io.emit("activeUsers", { count: activeNow });
    
    console.log(`Active users: ${activeNow}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Socket service running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
