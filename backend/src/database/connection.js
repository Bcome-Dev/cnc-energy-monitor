import pg from 'pg';
const { Pool } = pg;

class Database {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  async connect() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cnc_monitor',
      user: process.env.DB_USER || 'cnc_user',
      password: process.env.DB_PASSWORD || 'cnc_pass_2024',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.connected = true;
      console.log('[Database] Connection pool established');
    } catch (error) {
      this.connected = false;
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      console.log('[Database] Connection pool closed');
    }
  }

  isConnected() {
    return this.connected;
  }

  // Insert sensor data
  async insertSensorData(data) {
    const query = `
      INSERT INTO sensor_data (tegangan, arus, daya_va, energi_kwh, relay_aktif, peringatan, sensor_ok)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, timestamp
    `;
    const values = [
      data.tegangan,
      data.arus,
      data.dayaVA,
      data.energiKWh,
      data.relayAktif,
      data.peringatan,
      data.sensorOk
    ];
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Insert sensor data error:', error.message);
      throw error;
    }
  }

  // Get latest sensor data
  async getLatestSensor() {
    const query = 'SELECT * FROM latest_sensor';
    try {
      const result = await this.pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[Database] Get latest sensor error:', error.message);
      throw error;
    }
  }

  // Get sensor history with time range
  async getSensorHistory(startTime, endTime, limit = 1000) {
    const query = `
      SELECT * FROM sensor_data
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    try {
      const result = await this.pool.query(query, [startTime, endTime, limit]);
      return result.rows;
    } catch (error) {
      console.error('[Database] Get sensor history error:', error.message);
      throw error;
    }
  }

  // Insert relay command
  async insertRelayCommand(channel, command, source = 'frontend') {
    const query = `
      INSERT INTO relay_commands (relay_channel, command, source)
      VALUES ($1, $2, $3)
      RETURNING id, timestamp
    `;
    try {
      const result = await this.pool.query(query, [channel, command, source]);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Insert relay command error:', error.message);
      throw error;
    }
  }

  // Confirm relay command
  async confirmRelayCommand(id) {
    const query = `
      UPDATE relay_commands
      SET confirmed = true, confirmed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Confirm relay command error:', error.message);
      throw error;
    }
  }

  // Update device status
  async updateDeviceStatus(online, ipAddress = null, firmwareVersion = null) {
    const query = `
      UPDATE device_status
      SET online = $1, last_seen = NOW(), ip_address = $2, firmware_version = $3, updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    try {
      const result = await this.pool.query(query, [online, ipAddress, firmwareVersion]);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Update device status error:', error.message);
      throw error;
    }
  }

  // Get device status
  async getDeviceStatus() {
    const query = 'SELECT * FROM device_status WHERE id = 1';
    try {
      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Get device status error:', error.message);
      throw error;
    }
  }
}

const database = new Database();
export default database;
