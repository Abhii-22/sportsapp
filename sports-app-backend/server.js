// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const matchRoutes = require('./routes/matchRoutes');
const teamRoutes = require('./routes/teamRoutes'); // 👈 Imported Team Routes

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with open CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Connect to MongoDB Atlas Cloud Database
connectDB();

// Global CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.options('*', cors());

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Live Terminal Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  req.io = io;
  next();
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'AK Sports Backend API and WebSocket Server are running.',
  });
});

// Mount Express API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes); // 👈 Mounted Team Routes

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Manage Real-time WebSocket Client Connections
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ WebSocket client disconnected: ${socket.id}`);
  });
});

// Catch unhandled database rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err);
});

// Start Express Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AK Sports Server running on port ${PORT}`);
});