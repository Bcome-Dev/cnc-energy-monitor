# CNC Energy Monitor - Struktur Backend

## Struktur File

```
backend/
├── docker-compose.yml          # Orchestration: Backend, MQTT, PostgreSQL
├── Dockerfile                  # Backend container image
├── package.json                # Node.js dependencies
├── .env.example                # Template environment variables
├── .gitignore
├── README.md                   # Dokumentasi backend
├── INTEGRATION_GUIDE.md        # Panduan integrasi frontend-backend
├── FRONTEND_INTEGRATION.js     # File api.js untuk frontend (copy ke frontend)
├── init.sql                    # Database schema initialization
│
├── mosquitto/                  # MQTT Broker config
│   ├── config/
│   │   └── mosquitto.conf
│   ├── data/                   # Persistent data
│   └── log/                    # MQTT logs
│
├── esp32/                      # ESP32 Firmware
│   ├── README.md               # Dokumentasi firmware
│   ├── cnc_monitor_mqtt.ino    # Main firmware dengan MQTT
│   ├── test_relay.ino          # Testing relay module
│   └── kalibrasi_sensor.ino    # Kalibrasi sensor tegangan/arus
│
└── src/                        # Backend source code
    ├── index.js                # Entry point
    ├── database/
    │   └── connection.js       # PostgreSQL handler
    ├── mqtt/
    │   └── handler.js          # MQTT subscribe/publish logic
    ├── websocket/
    │   └── server.js           # WebSocket broadcast
    └── api/
        └── routes.js           # REST API endpoints
```

## Quick Commands

### Start Backend (Docker)
```bash
cd backend
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
```

### Stop Backend
```bash
docker-compose down
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

### Test MQTT
```bash
# Subscribe ke semua topics
mosquitto_sub -h localhost -t '#' -v

# Publish test data
mosquitto_pub -h localhost -t cnc/sensor -m '{"tegangan":220.5,"arus":1.25,"dayaVA":275.62,"energiKWh":0.5,"relayAktif":true,"peringatan":false,"sensorOk":true}'
```

## Endpoints Summary

- **Health**: `GET /health`
- **Latest Data**: `GET /api/monitoring`
- **History**: `GET /api/history?start=<timestamp>&end=<timestamp>&limit=<number>`
- **Connection Status**: `GET /api/connection`
- **Relay Command**: `POST /api/relay` 
  ```json
  {"channel": 1, "state": true}
  ```
- **WebSocket**: `ws://localhost:3000/ws`

## MQTT Topics

### Subscribe (Backend ← ESP32):
- `cnc/sensor` - Data sensor setiap 1 detik
- `cnc/relay/status` - Konfirmasi relay dari ESP32

### Publish (Backend → ESP32):
- `cnc/relay/set` - Perintah relay ke ESP32

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **MQTT Broker**: Eclipse Mosquitto 2.0
- **WebSocket**: ws library
- **Container**: Docker & Docker Compose
