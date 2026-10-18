# FAQ - Pertanyaan yang Sering Ditanya

## 📌 Umum

### Q: Apakah project ini gratis?
**A:** Ya, 100% gratis dan open source (MIT License).

### Q: Berapa lama setup pertama kali?
**A:** 
- Install prerequisites: 15-30 menit
- Clone & setup project: 5-10 menit
- **Total: ~30-40 menit** untuk pertama kali

### Q: Apakah bisa jalan tanpa Docker?
**A:** Bisa, tapi harus install PostgreSQL dan Mosquitto manual. Docker lebih mudah.

### Q: Apakah bisa di Windows?
**A:** Ya! Tapi perlu:
- Docker Desktop for Windows
- Node.js for Windows
- Beberapa command harus disesuaikan (pakai PowerShell/CMD)

### Q: Apakah perlu internet?
**A:** 
- **Setup:** Perlu (download dependencies)
- **Running:** Tidak perlu (kecuali untuk remote access)

---

## 🔧 Technical

### Q: Data disimpan di mana?
**A:** PostgreSQL database di Docker volume. Tidak hilang saat restart, kecuali pakai `docker compose down -v`.

### Q: Berapa lama data disimpan?
**A:** Selamanya, kecuali dihapus manual. Untuk production, sebaiknya setup auto-cleanup data > 30 hari.

### Q: Bisakah multiple ESP32?
**A:** Ya, tapi perlu modifikasi:
- Setiap ESP32 pakai `mqtt_client_id` berbeda
- Backend perlu tracking multiple device
- Frontend perlu switch antara device

### Q: Apakah realtime?
**A:** Ya! Update setiap 1 detik dari ESP32 via MQTT → Backend → WebSocket → Frontend.

### Q: Maksimal berapa data point?
**A:** Teoritis jutaan. Tapi untuk performance baik:
- < 100,000 records: sangat cepat
- > 1,000,000 records: pertimbangkan aggregation/archiving

---

## 🐛 Error & Troubleshooting

### Q: Error "port already in use"
**A:** 
```bash
# Cek yang pakai port:
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :1883  # MQTT

# Kill process:
kill -9 <PID>
```

### Q: Error "Docker daemon not running"
**A:**
```bash
# Start Docker:
sudo systemctl start docker

# Enable auto-start:
sudo systemctl enable docker
```

### Q: Frontend blank putih
**A:**
1. Buka browser Console (F12)
2. Lihat error merah
3. Biasanya:
   - Backend belum running
   - File .env salah
   - Import error (cek `npm install`)

### Q: ESP32 tidak konek ke MQTT
**A:**
1. Cek ESP32 dan laptop di WiFi yang sama
2. Cek IP backend: `hostname -I`
3. Update `mqtt_server` di firmware
4. Test ping dari ESP32 IP ke laptop IP
5. Disable firewall atau allow port 1883

### Q: Database error "ECONNREFUSED"
**A:**
```bash
# Restart PostgreSQL:
sudo docker compose restart postgres

# Atau reset:
sudo docker compose down -v
sudo docker compose up -d
```

---

## 🔒 Security

### Q: Apakah aman untuk production?
**A:** Untuk production, tambahkan:
- [ ] MQTT authentication (username/password)
- [ ] HTTPS/TLS untuk API
- [ ] Ganti default password database
- [ ] Setup firewall (only allow specific ports)
- [ ] Rate limiting di API
- [ ] Input validation & sanitization

### Q: File .env aman?
**A:** File `.env` ada di `.gitignore`, jadi **tidak** masuk GitHub. Tapi:
- Jangan share file .env via chat/email
- Gunakan secrets manager untuk production (misal: Docker Secrets, Vault)

### Q: Password database di code?
**A:** Password ada di `.env` (tidak di-commit). Untuk production, gunakan environment variables atau secrets manager.

---

## 📡 Hardware & ESP32

### Q: ESP32 apa saja yang support?
**A:** Hampir semua ESP32:
- ESP32 DevKit v1
- ESP32 WROOM-32
- ESP32-S2/S3
- NodeMCU-32S

### Q: Sensor lain bisa ditambah?
**A:** Ya! Edit firmware ESP32:
- Tambah pin sensor baru
- Read sensor di `loop()`
- Tambahkan ke JSON payload
- Update backend schema & frontend UI

### Q: Relay berapa channel?
**A:** Sekarang 2 channel. Bisa tambah lebih:
- Edit ESP32 firmware (tambah GPIO)
- Update backend API
- Update frontend UI

### Q: Apakah perlu kalibrasi sensor?
**A:** Ya, sangat disarankan! Gunakan:
- File `backend/esp32/kalibrasi_sensor.ino`
- Bandingkan dengan multimeter
- Adjust `TEGANGAN_SENSITIVITY` dan `ARUS_SENSITIVITY`

---

## 💾 Database

### Q: Bisa pakai MySQL?
**A:** Bisa, tapi perlu ubah:
- `backend/src/database/connection.js` (ganti driver `pg` ke `mysql2`)
- `docker-compose.yml` (ganti image postgres ke mysql)
- `init.sql` (sesuaikan syntax MySQL)

### Q: Bisa pakai SQLite?
**A:** Bisa! Lebih ringan, tapi:
- Tidak cocok untuk concurrent writes
- Tidak support scale horizontal
- Cocok untuk prototype/single user

### Q: Backup database gimana?
**A:**
```bash
# Export data:
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > backup.sql

# Restore:
sudo docker exec -i cnc-postgres psql -U cnc_user cnc_monitor < backup.sql
```

---

## 🌐 Deployment

### Q: Deploy ke cloud?
**A:** Bisa! Beberapa opsi:
- **Railway** - Deploy Docker Compose langsung
- **DigitalOcean** - VPS + Docker
- **AWS/GCP/Azure** - EC2/Compute Engine + managed DB
- **Heroku** - Deploy backend (gratis tier ada)

### Q: Bisa akses dari internet?
**A:** Ya, dengan:
1. Deploy backend ke VPS/Cloud
2. Konfigurasi domain & SSL
3. ESP32 connect ke public MQTT broker
4. Frontend bisa host di Vercel/Netlify (gratis)

### Q: Berapa biaya hosting?
**A:**
- **Gratis:** Railway (free tier), Heroku, Render
- **Murah:** DigitalOcean ($5/month), Linode ($5/month)
- **Managed:** AWS/GCP (~$20-50/month dengan DB managed)

---

## 👥 Collaboration

### Q: Cara kerja tim di Git?
**A:**
```bash
# Developer A:
git checkout -b feature-x
# buat perubahan
git add .
git commit -m "Add feature X"
git push origin feature-x
# Buat Pull Request di GitHub

# Developer B:
git pull origin main
# Review & merge PR di GitHub
```

### Q: Merge conflict gimana?
**A:**
```bash
git pull origin main
# Jika ada conflict, edit file yang conflict
# Hapus marker <<<<<<, ======, >>>>>>
git add .
git commit -m "Resolve conflict"
git push
```

---

## 📊 Performance

### Q: Berapa user bisa akses bersamaan?
**A:** 
- Development mode: ~10-20 user
- Production (optimized): 100-500+ user
- Tergantung spesifikasi server

### Q: Cara optimasi performance?
**A:**
- [ ] Add Redis cache untuk API response
- [ ] Database indexing (sudah ada di `init.sql`)
- [ ] Frontend: lazy loading, code splitting
- [ ] Backend: connection pooling (sudah implemented)
- [ ] Use CDN untuk static assets

---

## 🔄 Update & Maintenance

### Q: Cara update dependencies?
**A:**
```bash
# Check outdated:
npm outdated

# Update all:
npm update

# Update specific:
npm install package@latest
```

### Q: Cara update Docker images?
**A:**
```bash
cd backend
sudo docker compose pull
sudo docker compose up -d
```

---

## 🆘 Support

### Q: Dimana tanya jika stuck?
**A:**
1. Baca dokumentasi (`README.md`, `SETUP_LENGKAP.md`)
2. Cek FAQ ini
3. Buka issue di GitHub
4. Diskusi dengan tim

### Q: Bisa minta bantuan setup?
**A:** Ya! Buka issue di GitHub dengan:
- Deskripsi masalah
- Screenshot error
- OS yang dipakai
- Log files (dari `docker compose logs`)

---

**💡 Pertanyaan lain? Buat issue di GitHub atau tambahkan ke FAQ ini!**
