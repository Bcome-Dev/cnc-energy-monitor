import express from 'express';
import database from '../database/connection.js';
import mqttHandler from '../mqtt/handler.js';

const router = express.Router();

// GET /api/monitoring - Get latest sensor data
router.get('/monitoring', async (req, res) => {
  try {
    const data = await database.getLatestSensor();
    
    if (!data) {
      return res.status(404).json({ 
        error: 'No sensor data available',
        message: 'ESP32 belum mengirim data' 
      });
    }

    res.json({
      success: true,
      data: {
        ts: new Date(data.timestamp).getTime(),
        v: data.tegangan,
        i: data.arus,
        p: data.daya_va,
        e: data.energi_kwh,
        run: data.relay_aktif,
        r1: data.relay_aktif, // Sesuaikan dengan relay channel
        r2: false, // Sesuaikan dengan relay channel
        warning: data.peringatan,
        sensorOk: data.sensor_ok
      }
    });
  } catch (error) {
    console.error('[API] Error getting monitoring data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/history - Get sensor history
router.get('/history', async (req, res) => {
  try {
    // Parse query parameters
    const { start, end, limit } = req.query;
    
    const startTime = start ? new Date(parseInt(start)) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24 jam lalu
    const endTime = end ? new Date(parseInt(end)) : new Date();
    const maxLimit = limit ? parseInt(limit) : 1000;

    const history = await database.getSensorHistory(startTime, endTime, maxLimit);

    res.json({
      success: true,
      count: history.length,
      data: history.map(row => ({
        ts: new Date(row.timestamp).getTime(),
        v: row.tegangan,
        i: row.arus,
        p: row.daya_va,
        e: row.energi_kwh,
        run: row.relay_aktif,
        r1: row.relay_aktif,
        r2: false,
        warning: row.peringatan,
        sensorOk: row.sensor_ok
      }))
    });
  } catch (error) {
    console.error('[API] Error getting history:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/connection - Get device connection status
router.get('/connection', async (req, res) => {
  try {
    const status = await database.getDeviceStatus();
    
    res.json({
      success: true,
      online: status.online,
      lastSeen: status.last_seen ? new Date(status.last_seen).getTime() : null,
      ipAddress: status.ip_address,
      firmwareVersion: status.firmware_version
    });
  } catch (error) {
    console.error('[API] Error getting connection status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/relay - Send relay command to ESP32
router.post('/relay', async (req, res) => {
  try {
    const { channel, state } = req.body;

    // Validation
    if (typeof channel !== 'number' || typeof state !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'channel (number) dan state (boolean) harus disediakan' 
      });
    }

    // Check device online
    const deviceStatus = await database.getDeviceStatus();
    if (!deviceStatus.online) {
      return res.status(503).json({ 
        error: 'Device offline',
        message: 'ESP32 tidak terhubung' 
      });
    }

    // Save command to database
    const commandRecord = await database.insertRelayCommand(channel, state, 'frontend');

    // Publish to MQTT
    await mqttHandler.publishRelayCommand(channel, state);

    res.json({
      success: true,
      message: 'Relay command sent',
      data: {
        commandId: commandRecord.id,
        channel,
        state,
        timestamp: commandRecord.timestamp
      }
    });
  } catch (error) {
    console.error('[API] Error sending relay command:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/settings - Get settings (dari localStorage frontend, ini hanya placeholder)
router.get('/settings', async (req, res) => {
  // Settings disimpan di localStorage frontend, backend tidak perlu menyimpan
  res.json({
    success: true,
    message: 'Settings endpoint - handled by frontend localStorage'
  });
});

// POST /api/settings - Save settings (placeholder)
router.post('/settings', async (req, res) => {
  res.json({
    success: true,
    message: 'Settings saved - handled by frontend localStorage'
  });
});

export default router;
