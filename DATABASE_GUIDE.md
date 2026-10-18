# 💾 Database Management Guide

Panduan lengkap untuk mengelola database PostgreSQL di project ini.

---

## 📍 Lokasi Database

Database disimpan di **Docker Volume** bernama `backend_postgres_data`.

**Lokasi fisik:**
```
/var/lib/docker/volumes/backend_postgres_data/_data
```

**Karakteristik:**
- ✅ Data **persistent** (tidak hilang saat restart)
- ✅ Dikelola otomatis oleh Docker
- ✅ Bisa di-backup dan restore
- ⚠️ Akan **hilang** jika jalankan `docker compose down -v`

---

## 📊 Cek Status Database

### Cek Jumlah Data
```bash
# Total records sensor data
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "SELECT COUNT(*) FROM sensor_data;"

# Data 24 jam terakhir
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "SELECT COUNT(*) FROM sensor_data WHERE timestamp > NOW() - INTERVAL '24 hours';"

# Ukuran database
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "SELECT pg_size_pretty(pg_database_size('cnc_monitor'));"
```

### Cek Volume Docker
```bash
# List volumes
sudo docker volume ls

# Inspect volume detail
sudo docker volume inspect backend_postgres_data

# Cek ukuran
sudo du -sh /var/lib/docker/volumes/backend_postgres_data/_data
```

---

## 💾 Backup Database

### Manual Backup

#### 1. Backup Full Database
```bash
# Backup ke file SQL
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup ke file compressed
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 2. Backup Specific Table
```bash
# Backup hanya sensor_data
sudo docker exec cnc-postgres pg_dump -U cnc_user -d cnc_monitor -t sensor_data > sensor_data_backup.sql

# Backup hanya data (tanpa schema)
sudo docker exec cnc-postgres pg_dump -U cnc_user -d cnc_monitor --data-only > data_only_backup.sql
```

### Automated Backup (Cron Job)

#### Setup Auto Backup Setiap Hari

1. **Buat script backup:**
```bash
nano ~/backup_cnc_db.sh
```

2. **Isi script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/cnc_backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor | gzip > "$BACKUP_DIR/cnc_backup_$DATE.sql.gz"

# Hapus backup lebih dari 7 hari
find $BACKUP_DIR -name "cnc_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: cnc_backup_$DATE.sql.gz"
```

3. **Buat executable:**
```bash
chmod +x ~/backup_cnc_db.sh
```

4. **Setup cron (backup setiap hari jam 2 pagi):**
```bash
crontab -e

# Tambahkan baris ini:
0 2 * * * /home/$USER/backup_cnc_db.sh >> /home/$USER/backup_cnc_db.log 2>&1
```

---

## 🔄 Restore Database

### Restore dari Backup

#### 1. Stop Backend (agar tidak ada koneksi aktif)
```bash
cd backend
sudo docker compose stop backend
```

#### 2. Drop & Recreate Database (Optional)
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d postgres -c "DROP DATABASE IF EXISTS cnc_monitor;"
sudo docker exec cnc-postgres psql -U cnc_user -d postgres -c "CREATE DATABASE cnc_monitor;"
```

#### 3. Restore dari File
```bash
# Dari file .sql
sudo docker exec -i cnc-postgres psql -U cnc_user cnc_monitor < backup_20261018_120000.sql

# Dari file .sql.gz
gunzip -c backup_20261018_120000.sql.gz | sudo docker exec -i cnc-postgres psql -U cnc_user cnc_monitor
```

#### 4. Restart Backend
```bash
sudo docker compose start backend
```

---

## 🗑️ Maintenance & Cleanup

### Hapus Data Lama

#### Manual Delete (Data > 30 hari)
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "DELETE FROM sensor_data WHERE timestamp < NOW() - INTERVAL '30 days';"

# Cek berapa data yang akan dihapus (tanpa hapus)
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "SELECT COUNT(*) FROM sensor_data WHERE timestamp < NOW() - INTERVAL '30 days';"
```

#### Vacuum Database (Reclaim Space)
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "VACUUM FULL sensor_data;"
```

### Setup Auto-Cleanup

**Script cleanup otomatis:**
```bash
nano ~/cleanup_old_data.sh
```

```bash
#!/bin/bash
# Hapus data sensor lebih dari 30 hari
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "DELETE FROM sensor_data WHERE timestamp < NOW() - INTERVAL '30 days';"

# Vacuum
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "VACUUM sensor_data;"

echo "Cleanup completed at $(date)"
```

```bash
chmod +x ~/cleanup_old_data.sh

# Run setiap minggu (Minggu jam 3 pagi)
crontab -e
0 3 * * 0 /home/$USER/cleanup_old_data.sh >> /home/$USER/cleanup.log 2>&1
```

---

## 🔀 Migrasi Database

### Export ke Laptop Lain

#### 1. Backup di Laptop A
```bash
sudo docker exec cnc-postgres pg_dump -U cnc_user cnc_monitor > cnc_export.sql
```

#### 2. Transfer ke Laptop B
```bash
# Via USB, cloud, atau:
scp cnc_export.sql user@laptop-b:~/
```

#### 3. Import di Laptop B
```bash
cd /path/to/cnc-energy-monitor/backend
sudo docker compose up -d postgres
sudo docker exec -i cnc-postgres psql -U cnc_user cnc_monitor < ~/cnc_export.sql
```

---

## 🔧 Advanced Operations

### Reset Database (Fresh Start)

```bash
cd backend

# Stop semua
sudo docker compose down

# Hapus volume (data akan hilang!)
sudo docker volume rm backend_postgres_data

# Start ulang (database kosong)
sudo docker compose up -d
```

### Clone Volume (Backup Volume Docker)

```bash
# Create backup volume
sudo docker volume create backend_postgres_data_backup

# Copy data
sudo docker run --rm \
  -v backend_postgres_data:/source \
  -v backend_postgres_data_backup:/target \
  alpine sh -c "cd /source && cp -av . /target"
```

### Access Database Console

```bash
# Masuk ke PostgreSQL console
sudo docker exec -it cnc-postgres psql -U cnc_user -d cnc_monitor

# Setelah masuk, bisa jalankan SQL:
cnc_monitor=# SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 10;
cnc_monitor=# \dt  -- List tables
cnc_monitor=# \q   -- Quit
```

---

## 📊 Monitoring Database

### Check Database Size
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Check Active Connections
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'cnc_monitor';
"
```

### Slow Queries (Performance)
```bash
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
"
```

---

## 🔐 Security

### Change Database Password

1. **Update di container:**
```bash
sudo docker exec cnc-postgres psql -U postgres -c "ALTER USER cnc_user WITH PASSWORD 'new_password_here';"
```

2. **Update di .env:**
```bash
nano backend/.env
# Ganti: DB_PASSWORD=new_password_here
```

3. **Restart backend:**
```bash
cd backend
sudo docker compose restart backend
```

---

## ⚠️ Important Notes

1. **JANGAN gunakan `docker compose down -v` kecuali mau hapus data!**
   - ✅ Aman: `docker compose down`
   - ❌ Bahaya: `docker compose down -v` (hapus data!)

2. **Backup sebelum upgrade Docker/PostgreSQL**

3. **Gunakan retention policy** untuk data production (auto-delete data lama)

4. **Monitor disk space** secara berkala:
   ```bash
   df -h
   ```

5. **Test restore backup** secara berkala untuk ensure backup works!

---

## 🆘 Troubleshooting

### Database Corrupt
```bash
# Stop backend
sudo docker compose stop backend

# Reindex
sudo docker exec cnc-postgres reindexdb -U cnc_user cnc_monitor

# Restart
sudo docker compose start backend
```

### Out of Space
```bash
# Check space
df -h

# Delete old data
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "DELETE FROM sensor_data WHERE timestamp < NOW() - INTERVAL '7 days';"

# Vacuum
sudo docker exec cnc-postgres psql -U cnc_user -d cnc_monitor -c "VACUUM FULL;"
```

---

**💡 Tip:** Buat backup rutin dan simpan di cloud (Google Drive, Dropbox) untuk extra safety!
