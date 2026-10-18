# CNC Energy Monitor - Quick Start

## 🚀 Menjalankan Aplikasi

Jalankan perintah ini **satu kali** di terminal:

```bash
cd /home/sutan/Downloads/cnc-energy-monitor/backend
./setup.sh
```

Script akan otomatis:
- ✅ Stop backend mock yang lama
- ✅ Start PostgreSQL database
- ✅ Start MQTT Broker (Mosquitto)
- ✅ Start Backend API
- ✅ Start Frontend web

**Catatan:** Script akan meminta password sudo untuk Docker.

---

## 🌐 Akses Aplikasi

Setelah setup selesai, buka browser:

**http://localhost:5173**

---

## 🛑 Menghentikan Aplikasi

```bash
cd /home/sutan/Downloads/cnc-energy-monitor
./stop.sh
```

---

## 📊 Status & Monitoring

### Cek Status Containers
```bash
cd backend
sudo docker compose ps
```

### Lihat Logs Backend
```bash
cd backend
sudo docker compose logs -f backend
```

### Lihat Logs Frontend
```bash
tail -f frontend.log
```

### Test API
```bash
curl http://localhost:3000/health
```

---

## 🔧 Troubleshooting

### Backend tidak jalan
```bash
cd backend
sudo docker compose logs backend
```

### Database error
```bash
cd backend
sudo docker compose restart postgres
sudo docker compose logs postgres
```

### Reset semua data
```bash
cd backend
sudo docker compose down -v
sudo docker compose up -d
```

---

## 📡 Koneksi ESP32

1. Edit `backend/esp32/cnc_monitor_mqtt.ino`
2. Ganti WiFi SSID & password
3. Ganti MQTT server ke IP komputer Anda:
   ```cpp
   const char* mqtt_server = "192.168.1.xxx";  // IP komputer
   ```
4. Upload ke ESP32

Cek IP komputer:
```bash
hostname -I
```

---

## 🎯 Services Running

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 3000 | http://localhost:3000/api |
| WebSocket | 3000 | ws://localhost:3000/ws |
| PostgreSQL | 5432 | localhost:5432 |
| Mosquitto | 1883 | localhost:1883 |

---

**Support:** Jika ada masalah, cek logs atau buka issue.
