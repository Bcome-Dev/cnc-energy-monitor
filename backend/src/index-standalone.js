import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== MOCK DATA STORE (Sementara tanpa Database) =====
let sensorDataStore = [];
let deviceOnline = true;
let lastSeen = Date.now();

// Generate initial mock data
function generateMockData() {
  const now = Date.now();
  return {
    timestamp: now,
    tegangan: 220 + (Math.random() - 0.5) * 10,
    arus: 1.0 + Math.random() * 0.5,
    daya_va: 0,
    energi_kwh: 0.5 + Math.random() * 0.1,
    relay_aktif: true,
    peringatan: false,
    sensor_ok: true
  };
}

// Initialize with some data
for (let i = 0; i < 100; i++) {
  const data = generateMockData();
  data.timestamp = Date.now() - (100 - i) * 1000;
  data.daya_va = data.tegangan * data.arus;
  sensorDataStore.push(data);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mqtt: false,
    database: false,
    mode: 'standalone-mock'
  });
});

// GET /api/monitoring - Latest sensor data
app.get('/api/monitoring', (req, res) => {
  const latest = sensorDataStore[sensorDataStore.length - 1] || generateMockData();
  
  res.json({
    success: true,
    data: {
      ts: latest.timestamp,
      v: parseFloat(latest.tegangan.toFixed(1)),
      i: parseFloat(latest.arus.toFixed(2)),
      p: parseFloat((latest.tegangan * latest.arus).toFixed(2)),
      e: parseFloat(latest.energi_kwh.toFixed(3)),
      run: latest.relay_aktif,
      r1: latest.relay_aktif,
      r2: false,
      warning: latest.peringatan,
      sensorOk: latest.sensor_ok
    }
  });
});

// GET /api/history
app.get('/api/history', (req, res) => {
  const { start, end, limit } = req.query;
  
  let filtered = [...sensorDataStore];
  
  if (start) {
    filtered = filtered.filter(d => d.timestamp >= parseInt(start));
  }
  if (end) {
    filtered = filtered.filter(d => d.timestamp <= parseInt(end));
  }
  if (limit) {
    filtered = filtered.slice(-parseInt(limit));
  }
  
  res.json({
    success: true,
    count: filtered.length,
    data: filtered.map(row => ({
      ts: row.timestamp,
      v: parseFloat(row.tegangan.toFixed(1)),
      i: parseFloat(row.arus.toFixed(2)),
      p: parseFloat((row.tegangan * row.arus).toFixed(2)),
      e: parseFloat(row.energi_kwh.toFixed(3)),
      run: row.relay_aktif,
      r1: row.relay_aktif,
      r2: false,
      warning: row.peringatan,
      sensorOk: row.sensor_ok
    }))
  });
});

// GET /api/connection
app.get('/api/connection', (req, res) => {
  res.json({
    success: true,
    online: deviceOnline,
    lastSeen: lastSeen,
    ipAddress: '192.168.1.100',
    firmwareVersion: '1.0.0-mock'
  });
});

// POST /api/relay
app.post('/api/relay', (req, res) => {
  const { channel, state } = req.body;

  if (typeof channel !== 'number' || typeof state !== 'boolean') {
    return res.status(400).json({ 
      error: 'Invalid request',
      message: 'channel (number) dan state (boolean) harus disediakan' 
    });
  }

  console.log(`[API] Relay command: channel=${channel}, state=${state}`);

  res.json({
    success: true,
    message: 'Relay command sent (mock mode)',
    data: {
      commandId: Math.floor(Math.random() * 10000),
      channel,
      state,
      timestamp: new Date().toISOString()
    }
  });
});

// Create HTTP server
const server = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  ws.send(JSON.stringify({ 
    type: 'connected', 
    timestamp: Date.now(),
    mode: 'mock'
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// Broadcast new sensor data every 2 seconds
setInterval(() => {
  const newData = generateMockData();
  newData.daya_va = newData.tegangan * newData.arus;
  sensorDataStore.push(newData);
  
  // Keep only last 1000 records
  if (sensorDataStore.length > 1000) {
    sensorDataStore.shift();
  }
  
  // Broadcast to all WebSocket clients
  const wsPayload = {
    type: 'sensor_data',
    data: {
      ts: newData.timestamp,
      v: parseFloat(newData.tegangan.toFixed(1)),
      i: parseFloat(newData.arus.toFixed(2)),
      p: parseFloat(newData.daya_va.toFixed(2)),
      e: parseFloat(newData.energi_kwh.toFixed(3)),
      run: newData.relay_aktif,
      warning: newData.peringatan,
      sensorOk: newData.sensor_ok
    }
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(wsPayload));
    }
  });
  
  lastSeen = Date.now();
}, 2000);

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  CNC Energy Monitor - Backend API (Standalone Mode)        ║
╚════════════════════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ API available at http://localhost:${PORT}/api
✓ WebSocket available at ws://localhost:${PORT}/ws
✓ Health check: http://localhost:${PORT}/health

⚠️  Running in MOCK mode (no MQTT, no Database)
   Install PostgreSQL & Mosquitto or use Docker for full features

Endpoints:
  GET  /health
  GET  /api/monitoring
  GET  /api/history
  GET  /api/connection
  POST /api/relay

Press Ctrl+C to stop
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Backend] Shutting down gracefully...');
  server.close(() => {
    console.log('[Backend] Server closed');
    process.exit(0);
  });
});
