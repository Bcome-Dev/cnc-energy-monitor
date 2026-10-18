# Integrasi Frontend dengan Backend

Setelah backend selesai dibuat, ikuti langkah-langkah berikut untuk menghubungkan frontend dengan backend real.

## Step 1: Update Frontend API Service

Ganti file `src/services/api.js` di frontend dengan versi yang terhubung ke backend.

**Cara 1: Copy file yang sudah disediakan**
```bash
cp backend/FRONTEND_INTEGRATION.js src/services/api.js
```

**Cara 2: Edit manual**
Buka `src/services/api.js` dan ganti semua isinya dengan kode dari `backend/FRONTEND_INTEGRATION.js`

## Step 2: Konfigurasi Environment Variables (Frontend)

Buat file `.env` di root folder frontend:

```bash
cd /home/sutan/Downloads/cnc-energy-monitor
nano .env
```

Isi dengan:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

**Untuk Production:**
```env
VITE_API_URL=http://192.168.1.100:3000/api
VITE_WS_URL=ws://192.168.1.100:3000/ws
```

Ganti `192.168.1.100` dengan IP server backend Anda.

## Step 3: Install Dependencies Backend

```bash
cd backend
npm install
```

## Step 4: Start Backend Services

### Option A: Menggunakan Docker Compose (Recommended)

```bash
cd backend
docker-compose up -d
```

Ini akan menjalankan:
- MQTT Broker (Mosquitto) di port 1883
- PostgreSQL di port 5432
- Backend API di port 3000

Cek status:
```bash
docker-compose ps
docker-compose logs -f backend
```

### Option B: Manual (Development)

**Terminal 1: Start Database & MQTT**
```bash
cd backend
docker-compose up -d postgres mosquitto
```

**Terminal 2: Start Backend**
```bash
cd backend
npm run dev
```

## Step 5: Start Frontend

Di terminal baru:
```bash
cd /home/sutan/Downloads/cnc-energy-monitor
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Step 6: Upload Firmware ke ESP32

1. Buka Arduino IDE
2. Install library yang diperlukan:
   - **PubSubClient** (by Nick O'Leary)
   - **ArduinoJson** (by Benoit Blanchon)

3. Buka file `backend/esp32/cnc_monitor_mqtt.ino`

4. Edit konfigurasi WiFi dan MQTT:
```cpp
const char* ssid = "NamaWiFiAnda";
const char* password = "PasswordWiFi";
const char* mqtt_server = "192.168.1.100";  // IP komputer yang menjalankan backend
```

5. Pilih Board: **ESP32 Dev Module**

6. Upload ke ESP32

7. Buka Serial Monitor (115200 baud) untuk melihat status koneksi

## Step 7: Testing

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-18T10:05:32.485Z",
  "mqtt": true,
  "database": true
}
```

### Test 2: MQTT Publish Test (Tanpa ESP32)

Install MQTT client:
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto-clients

# MacOS
brew install mosquitto
```

Kirim test data:
```bash
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

Cek di frontend, data harusnya muncul dalam beberapa detik.

### Test 3: Relay Command

Dari frontend, klik tombol relay. Cek di backend logs:
```bash
docker-compose logs -f backend
```

Harusnya muncul:
```
[MQTT] Published relay command: channel=1, state=true
```

### Test 4: WebSocket Connection

Buka browser console di frontend (F12), harusnya muncul:
```
[WebSocket] Connected to backend
[WebSocket] Message received: {type: "connected", timestamp: ...}
```

## Troubleshooting

### Frontend tidak bisa connect ke backend

**Masalah:** CORS error atau connection refused

**Solusi:**
- Pastikan backend sudah running: `curl http://localhost:3000/health`
- Cek CORS di `backend/src/index.js` sudah enable
- Jika frontend dan backend beda IP, update `.env` dengan IP yang benar

### ESP32 tidak kirim data

**Masalah:** Serial Monitor menunjukkan "MQTT connection failed"

**Solusi:**
1. Pastikan ESP32 dan komputer backend di jaringan WiFi yang sama
2. Cek IP backend: `hostname -I` atau `ifconfig`
3. Ping dari ESP32 ke backend (cek Serial Monitor untuk WiFi.localIP())
4. Test koneksi MQTT:
   ```bash
   mosquitto_sub -h localhost -t cnc/sensor -v
   ```

### Data tidak realtime

**Masalah:** Data tidak update otomatis

**Solusi:**
- Cek WebSocket connection di browser console
- Pastikan backend tidak di-block firewall
- Restart backend: `docker-compose restart backend`

### Database error

**Masalah:** Backend error: "Database connection failed"

**Solusi:**
```bash
# Cek PostgreSQL running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

## Architecture Flow

```
ESP32 (MQTT Client)
   |
   | Publish: cnc/sensor (1s interval)
   |
   v
MQTT Broker (Mosquitto)
   |
   | Subscribe
   |
   v
Backend (Node.js)
   |
   ├─> Database (PostgreSQL) - Save sensor data
   |
   └─> WebSocket Broadcast
          |
          v
       Frontend (React)
          |
          | User clicks relay
          |
          v
       POST /api/relay
          |
          v
       Backend
          |
          | Publish: cnc/relay/set
          |
          v
       MQTT Broker
          |
          v
       ESP32 - Relay activated
```

## Production Deployment

### 1. Backend (Docker)

Edit `docker-compose.yml` untuk production:
- Ganti `POSTGRES_PASSWORD` dengan password kuat
- Enable MQTT authentication
- Setup reverse proxy (Nginx) untuk HTTPS

### 2. Frontend (Build)

```bash
npm run build
```

Serve folder `dist/` dengan Nginx atau hosting static.

### 3. Security

- Enable MQTT username/password authentication
- Use TLS/SSL untuk API dan WebSocket
- Firewall: hanya buka port yang diperlukan (80, 443, 1883)

## Monitoring Production

### View Logs
```bash
docker-compose logs -f
```

### Database Backup
```bash
docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > backup.sql
```

### Check MQTT Messages
```bash
docker exec -it cnc-mosquitto mosquitto_sub -t '#' -v
```

---

**Support**: Jika ada pertanyaan atau masalah, periksa logs di:
- Backend: `docker-compose logs backend`
- MQTT: `docker-compose logs mosquitto`
- Database: `docker-compose logs postgres`
- ESP32: Serial Monitor (115200 baud)
