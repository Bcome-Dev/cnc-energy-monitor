# 🚀 Setup Guide - CNC Energy Monitor

Panduan lengkap untuk setup project ini di laptop/komputer baru (untuk anggota tim).

## 📋 Prerequisites (Yang Harus Diinstall Dulu)

### 1. **Node.js & npm**
```bash
# Cek apakah sudah terinstall:
node --version  # Harus v18 atau lebih baru
npm --version

# Jika belum ada, download dari:
# https://nodejs.org/ (pilih LTS version)
```

### 2. **Docker & Docker Compose**
```bash
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install docker.io docker-compose-v2

# Cek versi:
docker --version
docker compose version

# Tambahkan user ke docker group (agar tidak perlu sudo terus):
sudo usermod -aG docker $USER
# Logout dan login lagi agar efek
```

### 3. **Git**
```bash
# Cek:
git --version

# Install (jika belum):
sudo apt-get install git
```

### 4. **MQTT Client (Optional, untuk testing)**
```bash
sudo apt-get install mosquitto-clients
```

---

## 📥 Clone Project dari GitHub

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/cnc-energy-monitor.git
cd cnc-energy-monitor

# 2. Cek branch
git branch  # Harus di 'main'
```

---

## ⚙️ Setup Backend

### 1. **Install Dependencies**
```bash
cd backend
npm install
```

### 2. **Copy Environment Variables**
```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit jika perlu (default sudah OK):
nano .env
```

**File `.env` akan berisi:**
```env
NODE_ENV=development
API_PORT=3000

MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC_SENSOR=cnc/sensor
MQTT_TOPIC_RELAY_SET=cnc/relay/set
MQTT_TOPIC_RELAY_STATUS=cnc/relay/status

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cnc_monitor
DB_USER=cnc_user
DB_PASSWORD=cnc_pass_2024
```

### 3. **Start Docker Containers**
```bash
# Dari folder backend/
sudo docker compose up -d

# Cek status:
sudo docker compose ps

# Harus muncul 3 containers:
# - cnc-postgres (PostgreSQL)
# - cnc-mosquitto (MQTT Broker)
# - cnc-backend (Backend API)
```

### 4. **Cek Backend Running**
```bash
# Test health check:
curl http://localhost:3000/health

# Response harus:
# {"status":"ok","timestamp":"...","mqtt":true,"database":true}
```

---

## 🎨 Setup Frontend

### 1. **Install Dependencies**
```bash
# Kembali ke root folder project
cd ..
npm install
```

### 2. **Create .env (Optional)**
```bash
# Jika ingin custom API URL, buat file .env:
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_WS_URL=ws://localhost:3000/ws" >> .env
```

### 3. **Start Development Server**
```bash
npm run dev

# Atau gunakan script helper:
setsid npx vite --host 0.0.0.0 --port 5173 > vite.log 2>&1 &

# Cek apakah running:
curl http://localhost:5173
```

### 4. **Buka Browser**
```
http://localhost:5173
```

✅ **Dashboard harus muncul!**

---

## 🧪 Testing dengan Data Simulasi

Karena ESP32 belum terhubung, kirim data test manual:

```bash
# Kirim 1 data test:
mosquitto_pub -h localhost -t cnc/sensor -m '{
  "tegangan": 220.5,
  "arus": 1.25,
  "dayaVA": 275.62,
  "energiKWh": 0.5,
  "relayAktif": true,
  "peringatan": false,
  "sensorOk": true
}'

# Kirim data multiple (loop):
for i in {1..10}; do
  mosquitto_pub -h localhost -t cnc/sensor -m "{\"tegangan\":$((220 + RANDOM % 5)),\"arus\":1.$((20 + RANDOM % 30)),\"dayaVA\":280,\"energiKWh\":0.5,\"relayAktif\":true,\"peringatan\":false,\"sensorOk\":true}"
  sleep 1
done

# Refresh browser - data akan muncul!
```

---

## 📡 Setup ESP32 (Hardware)

### 1. **Install Arduino IDE**
- Download: https://www.arduino.cc/en/software
- Install ESP32 Board Manager:
  - File → Preferences → Additional Board URLs:
    ```
    https://dl.espressif.com/dl/package_esp32_index.json
    ```
  - Tools → Board → Boards Manager → Cari "ESP32" → Install

### 2. **Install Libraries**
Di Arduino IDE:
- Sketch → Include Library → Manage Libraries
- Install:
  - **PubSubClient** by Nick O'Leary
  - **ArduinoJson** by Benoit Blanchon

### 3. **Edit Firmware**
Buka file: `backend/esp32/cnc_monitor_mqtt.ino`

Edit baris ini:
```cpp
// WiFi credentials
const char* ssid = "WIFI_KALIAN";
const char* password = "PASSWORD_WIFI";

// MQTT Server (IP laptop yang menjalankan backend)
const char* mqtt_server = "192.168.1.XXX";  // Ganti dengan IP laptop backend
```

**Cara cek IP laptop backend:**
```bash
hostname -I
# Contoh output: 192.168.1.105
# Gunakan IP pertama
```

### 4. **Upload ke ESP32**
- Tools → Board → ESP32 Dev Module
- Tools → Port → Pilih port ESP32 (misal: /dev/ttyUSB0)
- Click **Upload** (ikon panah)
- Buka Serial Monitor (115200 baud) untuk lihat status

### 5. **Cek Koneksi**
Di Serial Monitor harus muncul:
```
WiFi connected!
IP Address: 192.168.1.XXX
MQTT connected!
Published: {"tegangan":220.5,...}
```

✅ **Data real dari sensor akan otomatis masuk ke dashboard!**

---

## 🔧 Troubleshooting

### **1. Backend tidak start**
```bash
# Cek logs:
cd backend
sudo docker compose logs backend

# Restart:
sudo docker compose restart backend
```

### **2. Database error**
```bash
# Reset database:
cd backend
sudo docker compose down -v  # -v akan hapus data
sudo docker compose up -d
```

### **3. MQTT tidak konek**
```bash
# Test subscribe:
mosquitto_sub -h localhost -t '#' -v

# Test publish:
mosquitto_pub -h localhost -t test -m "hello"

# Cek Mosquitto logs:
sudo docker compose logs mosquitto
```

### **4. Frontend blank/error**
```bash
# Cek browser Console (F12)
# Biasanya ada error JavaScript

# Restart frontend:
pkill -f vite
npm run dev
```

### **5. Port sudah dipakai**
```bash
# Cek port 3000:
lsof -i :3000

# Cek port 5173:
lsof -i :5173

# Kill process:
kill -9 <PID>
```

### **6. ESP32 tidak connect**
- Pastikan ESP32 dan laptop di WiFi yang sama
- Ping dari laptop ke ESP32 (lihat IP di Serial Monitor)
- Cek firewall laptop (allow port 1883)

---

## 🛑 Stop Semua Services

```bash
# Stop frontend:
pkill -f vite

# Stop backend:
cd backend
sudo docker compose down

# Stop dan hapus data:
sudo docker compose down -v
```

---

## 🔄 Update Code dari GitHub

Jika ada update dari teman:

```bash
# Pull latest changes:
git pull origin main

# Update dependencies:
npm install
cd backend && npm install && cd ..

# Restart services:
cd backend
sudo docker compose restart
cd ..
pkill -f vite
npm run dev
```

---

## 📊 Struktur Folder Penting

```
cnc-energy-monitor/
├── backend/               # Backend Node.js
│   ├── .env              # ⚠️ TIDAK di GitHub (rahasia)
│   ├── docker-compose.yml
│   ├── src/
│   └── esp32/            # Firmware Arduino
├── src/                  # Frontend React
│   ├── components/
│   ├── pages/
│   └── services/
├── .env                  # ⚠️ TIDAK di GitHub (optional untuk frontend)
├── package.json
└── README.md             # Dokumentasi utama
```

**⚠️ PENTING:** File `.env` **TIDAK** ada di GitHub (untuk keamanan). Harus dibuat manual di setiap laptop.

---

## 👥 Workflow Tim

### **Developer A (Laptop 1):**
```bash
# 1. Buat perubahan
git add .
git commit -m "Tambah fitur X"
git push origin main
```

### **Developer B (Laptop 2):**
```bash
# 2. Ambil perubahan
git pull origin main
npm install  # Update dependencies jika ada
```

---

## 📝 Checklist Setup Baru

- [ ] Node.js & npm installed
- [ ] Docker & Docker Compose installed
- [ ] Git installed
- [ ] Clone repository dari GitHub
- [ ] `cd backend && npm install`
- [ ] `cd .. && npm install`
- [ ] Copy `backend/.env.example` ke `backend/.env`
- [ ] `sudo docker compose up -d` di folder backend
- [ ] Test: `curl http://localhost:3000/health`
- [ ] `npm run dev` di root folder
- [ ] Buka browser: `http://localhost:5173`
- [ ] ✅ Dashboard muncul!

---

## 🆘 Bantuan

Jika stuck:
1. Cek logs: `sudo docker compose logs -f`
2. Cek browser Console (F12)
3. Screenshot error dan share ke tim
4. Baca file `backend/INTEGRATION_GUIDE.md` untuk detail lebih lanjut

---

**🎉 Selamat! Setup selesai!**
