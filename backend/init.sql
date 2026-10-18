-- Database Schema untuk CNC Energy Monitor

-- Table: sensor_data (Time-series data dari ESP32)
CREATE TABLE IF NOT EXISTS sensor_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tegangan REAL NOT NULL,
    arus REAL NOT NULL,
    daya_va REAL NOT NULL,
    energi_kwh REAL NOT NULL,
    relay_aktif BOOLEAN NOT NULL DEFAULT FALSE,
    peringatan BOOLEAN NOT NULL DEFAULT FALSE,
    sensor_ok BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index untuk query by timestamp (penting untuk time-series)
CREATE INDEX idx_sensor_timestamp ON sensor_data(timestamp DESC);

-- Table: relay_commands (Log perintah relay dari Frontend)
CREATE TABLE IF NOT EXISTS relay_commands (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    relay_channel INTEGER NOT NULL,
    command BOOLEAN NOT NULL,
    source VARCHAR(50) DEFAULT 'frontend',
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ
);

-- Index untuk relay commands
CREATE INDEX idx_relay_timestamp ON relay_commands(timestamp DESC);

-- Table: device_status (Status koneksi ESP32)
CREATE TABLE IF NOT EXISTS device_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    online BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen TIMESTAMPTZ,
    ip_address VARCHAR(45),
    firmware_version VARCHAR(20),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default device status
INSERT INTO device_status (id, online, last_seen) 
VALUES (1, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- View: latest_sensor (untuk query cepat data terbaru)
CREATE OR REPLACE VIEW latest_sensor AS
SELECT * FROM sensor_data
ORDER BY timestamp DESC
LIMIT 1;

COMMENT ON TABLE sensor_data IS 'Time-series data dari sensor ESP32';
COMMENT ON TABLE relay_commands IS 'Log perintah relay yang dikirim ke ESP32';
COMMENT ON TABLE device_status IS 'Status koneksi dan info ESP32';
