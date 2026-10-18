# CNC Energy Monitor - Backend

Backend system untuk monitoring energi dan operasional mesin CNC menggunakan ESP32. Backend ini menjembatani komunikasi antara ESP32 (melalui MQTT) dan Frontend (melalui REST API + WebSocket).

## Tech Stack

- **Node.js 18+** - Runtime
- **Express** - REST API
- **MQTT (Eclipse Mosquitto)** - Komunikasi dengan ESP32
- **PostgreSQL** - Database time-series
- **WebSocket** - Real-time data ke Frontend
- **Docker Compose** - Container orchestration

## Struktur Project

```
backend/
├── docker-compose.yml          # Orchestration: Backend, MQTT, PostgreSQL
├── Dockerfile                  # Backend container
├── init.sql                    # Database schema
├── package.json
├── .env.example
├── mosquitto/
│   └── config/
│       └── mosquitto.conf      # MQTT broker config
└── src/
    ├── index.js                # Entry point
    ├── database/
    │   └── connection.js       # PostgreSQL handler
    ├── mqtt/
    │   └── handler.js          # MQTT subscribe/publish
    ├── websocket/
    │   └── server.js           # WebSocket broadcast
    └── api/
        └── routes.js           # REST API endpoints
```

## Quick Start

### 1. Setup Environment

```bash
cd backend
cp .env.example .env
# Edit .env jika perlu custom config
```

### 2. Run dengan Docker Compose (Recommended)

```bash
docker-compose up -d
```

Services yang akan berjalan:
- **MQTT Broker (Mosquitto)**: `localhost:1883`
- **PostgreSQL**: `localhost:5432`
- **Backend API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000/ws`

### 3. Run Manual (Development)

Jika ingin run tanpa Docker:

```bash
# Install dependencies
npm install

# Start PostgreSQL dan Mosquitto secara manual atau via Docker
docker-compose up -d postgres mosquitto

# Run backend
npm run dev
```

## REST API Endpoints

### GET /api/monitoring
Mendapatkan data sensor terbaru dari ESP32.

**Response:**
```json
{
  "success": true,
  "data": {
    "ts": 1697623421004,
    "v": 225.5,
    "i": 1.25,
    "p": 281.87,
    "e": 1.054,
    "run": true,
    "r1": true,
    "r2": false,
    "warning": false,
    "sensorOk": true
  }
}
```

### GET /api/history?start=<timestamp>&end=<timestamp>&limit=<number>
Mendapatkan history data sensor dalam rentang waktu tertentu.

**Query Parameters:**
- `start`: Unix timestamp (ms) - default: 24 jam lalu
- `end`: Unix timestamp (ms) - default: sekarang
- `limit`: Max records - default: 1000

### GET /api/connection
Mendapatkan status koneksi ESP32.

**Response:**
```json
{
  "success": true,
  "online": true,
  "lastSeen": 1697623421004,
  "ipAddress": "192.168.1.100",
  "firmwareVersion": "1.0.0"
}
```

### POST /api/relay
Mengirim perintah relay ke ESP32.

**Request Body:**
```json
{
  "channel": 1,
  "state": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Relay command sent",
  "data": {
    "commandId": 123,
    "channel": 1,
    "state": true,
    "timestamp": "2024-10-18T10:30:21.004Z"
  }
}
```

### GET /health
Health check endpoint.

## MQTT Topics

### Topics yang di-subscribe Backend:

1. **`cnc/sensor`** - Data sensor dari ESP32
   ```json
   {
     "tegangan": 225.5,
     "arus": 1.25,
     "dayaVA": 281.87,
     "energiKWh": 1.054,
     "relayAktif": true,
     "peringatan": false,
     "sensorOk": true
   }
   ```

2. **`cnc/relay/status`** - Konfirmasi status relay dari ESP32
   ```json
   {
     "channel": 1,
     "state": true,
     "timestamp": 1697623421004
   }
   ```

### Topics yang di-publish Backend:

1. **`cnc/relay/set`** - Perintah relay dari Frontend ke ESP32
   ```json
   {
     "channel": 1,
     "state": true,
     "timestamp": 1697623421004
   }
   ```

## WebSocket

Frontend dapat connect ke `ws://localhost:3000/ws` untuk menerima real-time data.

**Message Types:**
- `sensor_data` - Data sensor baru dari ESP32
- `relay_status` - Status relay update
- `connected` - Initial connection confirmation

## Database Schema

### Table: `sensor_data`
Time-series data dari ESP32.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| timestamp | TIMESTAMPTZ | Waktu data diterima |
| tegangan | REAL | Tegangan (V) |
| arus | REAL | Arus (A) |
| daya_va | REAL | Daya (VA) |
| energi_kwh | REAL | Energi kumulatif (kWh) |
| relay_aktif | BOOLEAN | Status relay |
| peringatan | BOOLEAN | Status peringatan |
| sensor_ok | BOOLEAN | Status sensor |

### Table: `relay_commands`
Log perintah relay dari Frontend.

### Table: `device_status`
Status koneksi ESP32.

## Monitoring & Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f mosquitto
docker-compose logs -f postgres
```

## Troubleshooting

### MQTT Connection Failed
- Pastikan Mosquitto container running: `docker-compose ps`
- Check logs: `docker-compose logs mosquitto`

### Database Connection Failed
- Pastikan PostgreSQL container running
- Verify credentials di `.env`

### ESP32 Tidak Terdeteksi
- Pastikan ESP32 menggunakan MQTT broker yang sama (`MQTT_BROKER`)
- Check topic subscription/publish yang benar
- Gunakan MQTT client seperti MQTT Explorer untuk debug

## Production Considerations

1. **Security:**
   - Gunakan MQTT authentication (username/password)
   - Enable TLS/SSL untuk MQTT dan API
   - Gunakan environment variables untuk credentials

2. **Performance:**
   - Implement data retention policy (hapus data lama)
   - Add Redis cache untuk endpoint yang sering diakses
   - Use connection pooling (sudah implemented)

3. **Monitoring:**
   - Implement logging service (e.g., Winston, Pino)
   - Add metrics collection (e.g., Prometheus)
   - Setup alerts untuk device offline

## License

MIT
