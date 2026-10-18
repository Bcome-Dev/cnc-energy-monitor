# CNC Energy Monitor

Sistem monitoring energi dan operasional mesin CNC menggunakan ESP32, React, Node.js, PostgreSQL, dan MQTT.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Features

- ⚡ **Real-time Monitoring** - Tegangan, arus, daya, dan energi
- 📊 **Interactive Dashboard** - Grafik real-time dengan Recharts
- 🔌 **Relay Control** - Kontrol beban melalui web interface
- 📡 **MQTT Integration** - Komunikasi real-time dengan ESP32
- 💾 **Time-Series Database** - PostgreSQL untuk menyimpan data sensor
- 🌐 **WebSocket** - Update data real-time ke frontend
- 🐳 **Docker Ready** - Easy deployment dengan Docker Compose

## 🏗️ Architecture

```
┌─────────────┐
│   ESP32     │ ← Sensor (ZMPT101B, ACS712)
│   Firmware  │
└──────┬──────┘
       │ MQTT (1883)
       ↓
┌─────────────┐
│  Mosquitto  │ ← MQTT Broker
│   Broker    │
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│  Backend    │ ←──→ │ PostgreSQL   │
│  (Node.js)  │      │   Database   │
└──────┬──────┘      └──────────────┘
       │ REST API + WebSocket (3000)
       ↓
┌─────────────┐
│  Frontend   │ ← Dashboard (React + Vite)
│   (React)   │
└─────────────┘
```

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router 6
- Recharts (grafik)
- Tailwind CSS
- Lucide React (icons)
- Vite

### Backend
- Node.js 18+
- Express.js
- MQTT (mqtt.js)
- PostgreSQL (pg)
- WebSocket (ws)
- Docker & Docker Compose

### Hardware
- ESP32 DevKit
- ZMPT101B (Sensor Tegangan AC)
- ACS712 (Sensor Arus AC)
- Relay Module 2 Channel

## 📦 Installation

### Prerequisites

- Node.js 18+ dan npm
- Docker & Docker Compose
- Arduino IDE (untuk ESP32)

### Quick Start

1. **Clone repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cnc-energy-monitor.git
   cd cnc-energy-monitor
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Start backend services (Docker):**
   ```bash
   cd backend
   sudo docker compose up -d
   cd ..
   ```

5. **Start frontend:**
   ```bash
   npm run dev
   ```

6. **Buka browser:**
   ```
   http://localhost:5173
   ```

## 🔧 Configuration

### Backend Environment

Copy `.env.example` ke `.env` di folder `backend/`:

```env
NODE_ENV=production
API_PORT=3000

MQTT_BROKER=mosquitto
MQTT_PORT=1883

DB_HOST=postgres
DB_PORT=5432
DB_NAME=cnc_monitor
DB_USER=cnc_user
DB_PASSWORD=cnc_pass_2024
```

### ESP32 Firmware

Edit `backend/esp32/cnc_monitor_mqtt.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_SERVER_IP";  // IP komputer yang menjalankan backend
```

Upload ke ESP32 menggunakan Arduino IDE.

## 📡 API Endpoints

### REST API

- `GET /health` - Health check
- `GET /api/monitoring` - Data sensor terbaru
- `GET /api/history?start=<ts>&end=<ts>&limit=<n>` - History data
- `GET /api/connection` - Status koneksi ESP32
- `POST /api/relay` - Kirim perintah relay
  ```json
  {
    "channel": 1,
    "state": true
  }
  ```

### WebSocket

Connect ke `ws://localhost:3000/ws` untuk real-time updates.

## 🔌 MQTT Topics

### Subscribe (Backend ← ESP32):
- `cnc/sensor` - Data sensor (setiap 1 detik)
- `cnc/relay/status` - Konfirmasi status relay

### Publish (Backend → ESP32):
- `cnc/relay/set` - Perintah relay

### Sensor Data Format:
```json
{
  "tegangan": 220.5,
  "arus": 1.25,
  "dayaVA": 275.62,
  "energiKWh": 0.5,
  "relayAktif": true,
  "peringatan": false,
  "sensorOk": true
}
```

## 🗄️ Database Schema

```sql
-- sensor_data: Time-series data dari ESP32
CREATE TABLE sensor_data (
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

-- relay_commands: Log perintah relay
-- device_status: Status koneksi ESP32
```

## 🧪 Testing

### Test MQTT Manual

```bash
# Subscribe ke semua topics
mosquitto_sub -h localhost -t '#' -v

# Publish test data
mosquitto_pub -h localhost -t cnc/sensor -m '{
  "tegangan": 220.5,
  "arus": 1.25,
  "dayaVA": 275.62,
  "energiKWh": 0.5,
  "relayAktif": true,
  "peringatan": false,
  "sensorOk": true
}'
```

### Test API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/monitoring
```

## 📂 Project Structure

```
cnc-energy-monitor/
├── backend/                    # Backend Node.js
│   ├── docker-compose.yml     # Docker orchestration
│   ├── init.sql               # Database schema
│   ├── package.json
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── api/routes.js      # REST API
│   │   ├── mqtt/handler.js    # MQTT logic
│   │   ├── database/connection.js
│   │   └── websocket/server.js
│   ├── esp32/
│   │   ├── cnc_monitor_mqtt.ino   # Firmware ESP32
│   │   ├── test_relay.ino         # Test relay
│   │   └── kalibrasi_sensor.ino   # Kalibrasi sensor
│   └── mosquitto/config/
│       └── mosquitto.conf
├── src/                        # Frontend React
│   ├── components/            # UI components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API services
│   ├── utils/                 # Utilities
│   └── config/                # Configuration
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🐳 Docker Services

```bash
# Start all services
sudo docker compose up -d

# View logs
sudo docker compose logs -f backend

# Stop all services
sudo docker compose down

# Reset database (hapus semua data)
sudo docker compose down -v
```

## 🛑 Stop/Start Commands

### Stop Semua
```bash
pkill -f vite
cd backend
sudo docker compose down
```

### Start Semua
```bash
cd backend
sudo docker compose up -d
cd ..
npm run dev
```

## 📸 Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Control Panel
![Control](docs/control.png)

### Analytics
![Analytics](docs/analytics.png)

## 🔐 Security Considerations

- [ ] Ganti default password PostgreSQL di production
- [ ] Enable MQTT authentication (username/password)
- [ ] Setup TLS/SSL untuk API dan WebSocket
- [ ] Gunakan reverse proxy (Nginx) dengan HTTPS
- [ ] Implement rate limiting di API
- [ ] Sanitize input data dari ESP32

## 🚀 Production Deployment

### Menggunakan PM2 (Backend)

```bash
npm install -g pm2
pm2 start backend/src/index.js --name cnc-backend
pm2 startup
pm2 save
```

### Build Frontend

```bash
npm run build
# Serve folder dist/ dengan Nginx atau hosting static
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- React Team
- Node.js Community
- Eclipse Mosquitto
- PostgreSQL Team

## 📞 Support

Jika ada pertanyaan atau masalah:
- Buat issue di GitHub
- Email: your.email@example.com

---

**⭐ Jika project ini membantu, berikan star di GitHub!**
