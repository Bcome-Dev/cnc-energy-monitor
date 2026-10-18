# 🔧 Troubleshooting Guide

Panduan lengkap mengatasi masalah yang sering terjadi.

---

## 🚨 Backend Issues

### ❌ Error: "Cannot connect to Docker daemon"

**Gejala:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solusi:**
```bash
# 1. Start Docker daemon
sudo systemctl start docker

# 2. Enable auto-start
sudo systemctl enable docker

# 3. Cek status
sudo systemctl status docker

# 4. Jika masih error, restart
sudo systemctl restart docker

# 5. Tambahkan user ke group docker (agar tidak perlu sudo)
sudo usermod -aG docker $USER
# Logout dan login lagi
```

---

### ❌ Error: "Port 3000 already in use"

**Gejala:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solusi:**
```bash
# 1. Cari process yang pakai port 3000
lsof -i :3000

# 2. Kill process tersebut
kill -9 <PID>

# 3. Atau kill semua node process
pkill -f node

# 4. Restart backend
cd backend
sudo docker compose restart backend
```

---

### ❌ Error: "Database connection failed"

**Gejala:**
```
Error: Database connection failed: connect ECONNREFUSED
```

**Solusi:**
```bash
# 1. Cek PostgreSQL container running
sudo docker compose ps

# 2. Restart PostgreSQL
sudo docker compose restart postgres

# 3. Cek logs
sudo docker compose logs postgres

# 4. Jika masih error, reset database
sudo docker compose down -v
sudo docker compose up -d

# 5. Verify connection
docker exec -it cnc-postgres psql -U cnc_user -d cnc_monitor -c "SELECT NOW();"
```

---

### ❌ Error: "MQTT connection failed"

**Gejala:**
```
Error: MQTT connection failed
```

**Solusi:**
```bash
# 1. Cek Mosquitto running
sudo docker compose ps mosquitto

# 2. Restart
sudo docker compose restart mosquitto

# 3. Test manual
mosquitto_sub -h localhost -t test -v

# 4. Jika masih error, cek config
cat backend/mosquitto/config/mosquitto.conf

# 5. Cek logs
sudo docker compose logs mosquitto
```

---

## 🎨 Frontend Issues

### ❌ Web Blank Putih

**Gejala:** Browser menampilkan halaman putih kosong

**Solusi:**
```bash
# 1. Buka Developer Console (F12)
# 2. Lihat tab Console - ada error merah?

# 3. Common errors:
# - "Module not found" → npm install
# - "API error" → Backend belum running
# - "CORS error" → Backend CORS tidak configured

# 4. Hard refresh browser:
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)

# 5. Clear cache dan restart
rm -rf node_modules/.vite
pkill -f vite
npm run dev
```

---

### ❌ Error: "Failed to fetch"

**Gejala:**
```
Failed to fetch http://localhost:3000/api/monitoring
```

**Solusi:**
```bash
# 1. Cek backend running
curl http://localhost:3000/health

# 2. Jika tidak response, start backend
cd backend
sudo docker compose up -d

# 3. Cek .env frontend (jika ada)
cat .env
# Pastikan VITE_API_URL benar

# 4. Restart frontend
pkill -f vite
npm run dev
```

---

### ❌ Error: "Module ... does not provide export"

**Gejala:**
```
The requested module '/src/services/api.js' does not provide an export named 'mockControls'
```

**Solusi:**
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Clear cache
rm -rf node_modules/.vite

# 4. Restart
npm run dev
```

---

## 📡 ESP32 Issues

### ❌ ESP32 tidak connect ke WiFi

**Gejala:** Serial Monitor menunjukkan "Connecting to WiFi..." terus menerus

**Solusi:**
1. **Cek SSID dan Password:**
   ```cpp
   const char* ssid = "WIFI_BENAR";
   const char* password = "PASSWORD_BENAR";
   ```

2. **Pastikan WiFi 2.4GHz** (ESP32 tidak support 5GHz)

3. **Jarak ESP32 dekat dengan router**

4. **Restart ESP32** (tombol EN/RST)

5. **Upload ulang firmware**

---

### ❌ ESP32 connect WiFi tapi MQTT failed

**Gejala:**
```
WiFi connected!
MQTT connection failed, rc=-2
```

**Solusi:**
1. **Cek IP MQTT server:**
   ```cpp
   const char* mqtt_server = "192.168.1.XXX";  // IP laptop backend
   ```

2. **Cek IP laptop:**
   ```bash
   hostname -I
   # Pastikan IP sama dengan di firmware
   ```

3. **Ping test:**
   ```bash
   # Dari laptop, ping ESP32
   ping <IP_ESP32>
   ```

4. **Firewall:**
   ```bash
   # Ubuntu - allow port 1883
   sudo ufw allow 1883
   
   # Atau disable firewall untuk testing
   sudo ufw disable
   ```

5. **Test MQTT broker:**
   ```bash
   mosquitto_sub -h localhost -t test -v
   ```

---

### ❌ Sensor reading tidak akurat

**Gejala:** Tegangan/arus tidak sesuai dengan multimeter

**Solusi:**

1. **Kalibrasi sensor** menggunakan `backend/esp32/kalibrasi_sensor.ino`

2. **Adjust sensitivity:**
   ```cpp
   #define TEGANGAN_SENSITIVITY 0.430  // Ubah nilai ini
   #define ARUS_SENSITIVITY 0.066      // Ubah nilai ini
   ```

3. **Rumus kalibrasi:**
   ```
   New_Sensitivity = Old_Sensitivity × (Measured / Expected)
   
   Contoh:
   - Multimeter: 220V
   - ESP32 baca: 200V
   - Old sensitivity: 0.430
   - New = 0.430 × (200/220) = 0.391
   ```

4. **Cek wiring:**
   - ZMPT101B OUT → ESP32 GPIO34
   - ACS712 OUT → ESP32 GPIO35
   - VCC → 3.3V (bukan 5V!)
   - GND → GND

---

## 🐳 Docker Issues

### ❌ Container terus restart

**Gejala:**
```bash
$ sudo docker compose ps
NAME          STATUS
cnc-backend   Restarting (1) 5 seconds ago
```

**Solusi:**
```bash
# 1. Lihat logs
sudo docker compose logs backend | tail -50

# 2. Common errors:
# - Database not ready → Wait 10 seconds, retry
# - Port in use → Kill process using port
# - Missing env vars → Check .env file

# 3. Stop dan start ulang
sudo docker compose down
sudo docker compose up -d

# 4. Jika masih error, rebuild
sudo docker compose build --no-cache backend
sudo docker compose up -d
```

---

### ❌ "No space left on device"

**Gejala:**
```
Error: No space left on device
```

**Solusi:**
```bash
# 1. Cek disk usage
df -h

# 2. Clean Docker
sudo docker system prune -a --volumes
# WARNING: Ini akan hapus semua unused containers, images, volumes!

# 3. Atau hapus specific
sudo docker compose down -v  # Hapus volumes saja
sudo docker image prune      # Hapus unused images
```

---

## 🔐 Permission Issues

### ❌ "Permission denied" saat docker

**Gejala:**
```
Got permission denied while trying to connect to the Docker daemon
```

**Solusi:**
```bash
# 1. Tambahkan user ke docker group
sudo usermod -aG docker $USER

# 2. Apply group (pilih salah satu):
# Option A: Logout dan login lagi
# Option B: Atau jalankan
newgrp docker

# 3. Test
docker ps  # Tanpa sudo
```

---

### ❌ "EACCES: permission denied" npm

**Gejala:**
```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solusi:**
```bash
# JANGAN pakai sudo npm install!

# Solusi 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Solusi 2: Atau pakai nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

## 🌐 Network Issues

### ❌ Cannot access from other devices

**Gejala:** Laptop bisa akses `localhost:5173`, tapi HP/laptop lain tidak bisa

**Solusi:**
```bash
# 1. Start Vite dengan --host
npx vite --host 0.0.0.0 --port 5173

# 2. Cek IP laptop
hostname -I
# Contoh: 192.168.1.105

# 3. Akses dari device lain:
# http://192.168.1.105:5173

# 4. Firewall (Ubuntu)
sudo ufw allow 5173
sudo ufw allow 3000

# 5. Windows Firewall
# Control Panel → Firewall → Allow app
# Allow Node.js pada port 3000 dan 5173
```

---

## 💾 Database Issues

### ❌ Data hilang setelah restart

**Gejala:** Data sensor hilang setelah restart Docker

**Solusi:**
```bash
# 1. Cek apakah pakai volume
sudo docker compose ps -a

# 2. Volume seharusnya ada di docker-compose.yml:
volumes:
  postgres_data:

# 3. JANGAN pakai -v saat down
sudo docker compose down     # OK - data tetap ada
sudo docker compose down -v  # HATI-HATI - hapus data!

# 4. Backup data (recommended)
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > backup_$(date +%Y%m%d).sql
```

---

### ❌ "Too many connections"

**Gejala:**
```
Error: too many connections for role "cnc_user"
```

**Solusi:**
```bash
# 1. Restart PostgreSQL
sudo docker compose restart postgres

# 2. Atau increase max connections
# Edit docker-compose.yml, tambah di postgres:
command: postgres -c max_connections=200

# 3. Restart
sudo docker compose down
sudo docker compose up -d
```

---

## 🔧 Git Issues

### ❌ Merge conflict

**Gejala:**
```
CONFLICT (content): Merge conflict in src/file.js
```

**Solusi:**
```bash
# 1. Lihat file yang conflict
git status

# 2. Edit file, cari marker:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name

# 3. Pilih mana yang mau dipakai, hapus marker

# 4. Add dan commit
git add .
git commit -m "Resolve merge conflict"
```

---

### ❌ "Your local changes would be overwritten"

**Gejala:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Solusi:**
```bash
# Option 1: Simpan changes, lalu pull
git stash
git pull origin main
git stash pop

# Option 2: Commit dulu
git add .
git commit -m "WIP: work in progress"
git pull origin main

# Option 3: Discard changes (HATI-HATI!)
git reset --hard
git pull origin main
```

---

## 📱 General Tips

### ✅ Cek Status Semua Services

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl -I http://localhost:5173

# Docker containers
sudo docker compose ps

# Processes
ps aux | grep -E "node|vite" | grep -v grep
```

---

### ✅ Restart Semua dari Awal

```bash
# 1. Stop semua
pkill -f vite
cd backend
sudo docker compose down

# 2. Start backend
sudo docker compose up -d
sleep 10  # Wait for services to be ready

# 3. Test backend
curl http://localhost:3000/health

# 4. Start frontend
cd ..
npm run dev

# 5. Test frontend
curl http://localhost:5173
```

---

### ✅ Fresh Install

Jika semua gagal, mulai dari awal:

```bash
# 1. Backup data (optional)
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > backup.sql

# 2. Hapus semua
cd backend
sudo docker compose down -v
cd ..
rm -rf node_modules backend/node_modules

# 3. Reinstall
npm install
cd backend && npm install && cd ..

# 4. Start ulang
cd backend
sudo docker compose up -d
cd ..
npm run dev
```

---

## 📞 Masih Stuck?

1. **Cek logs lengkap:**
   ```bash
   # Backend
   sudo docker compose logs backend > backend-logs.txt
   
   # Frontend
   tail -100 vite.log > frontend-logs.txt
   
   # ESP32
   # Screenshot Serial Monitor
   ```

2. **Share ke tim:**
   - Screenshot error
   - Log files
   - Langkah yang sudah dicoba

3. **Buka issue di GitHub** dengan detail:
   - OS & versi (misal: Ubuntu 24.04)
   - Node version: `node --version`
   - Docker version: `docker --version`
   - Error message lengkap
   - Screenshot jika perlu

---

**💡 Tip:** Simpan file ini sebagai referensi. Hampir semua masalah bisa diselesaikan dengan panduan ini!
