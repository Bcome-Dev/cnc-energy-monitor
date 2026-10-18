import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import mqttHandler from './mqtt/handler.js';
import database from './database/connection.js';
import apiRoutes from './api/routes.js';
import { broadcast } from './websocket/server.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mqtt: mqttHandler.isConnected(),
    database: database.isConnected()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Create HTTP server
const server = createServer(app);

// WebSocket Server untuk real-time data ke Frontend
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  ws.on('message', (message) => {
    console.log('[WebSocket] Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });

  // Send initial status
  ws.send(JSON.stringify({ 
    type: 'connected', 
    timestamp: Date.now() 
  }));
});

// Export broadcast function untuk digunakan dari MQTT handler
export { wss };

// Initialize services
async function initialize() {
  try {
    // Connect to database
    await database.connect();
    console.log('[Database] Connected to PostgreSQL');

    // Connect to MQTT broker
    await mqttHandler.connect();
    console.log('[MQTT] Connected to broker');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`[Backend] Server running on port ${PORT}`);
      console.log(`[Backend] WebSocket available at ws://localhost:${PORT}/ws`);
      console.log(`[Backend] API available at http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('[Backend] Initialization failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Backend] SIGTERM received, shutting down gracefully...');
  await mqttHandler.disconnect();
  await database.disconnect();
  server.close(() => {
    console.log('[Backend] Server closed');
    process.exit(0);
  });
});

// Start application
initialize();
