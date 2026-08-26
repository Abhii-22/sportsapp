// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db'); //[cite: 6]
const authRoutes = require('./routes/authRoutes'); //[cite: 14]
const eventRoutes = require('./routes/eventRoutes'); //[cite: 15]
const matchRoutes = require('./routes/matchRoutes'); //[cite: 16]

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with open CORS for React Native mobile clients
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB Atlas Cloud Database
connectDB(); //[cite: 6]

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Higher payload limit for image/poster uploads

// Inject Socket.io into HTTP requests so controllers can emit live events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount Express API Endpoint Routes
app.use('/api/auth', authRoutes); //[cite: 14]
app.use('/api/events', eventRoutes); //[cite: 15]
app.use('/api/matches', matchRoutes); //[cite: 16]

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AK Sports Backend API and WebSocket Server are running.'
  });
});

// Manage Real-time WebSocket Client Connections
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ WebSocket client disconnected: ${socket.id}`);
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`AK Sports Server running on port ${PORT}`);
});