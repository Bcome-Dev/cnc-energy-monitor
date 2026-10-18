# ESP32 Firmware - CNC Energy Monitor

Firmware untuk ESP32 yang membaca sensor ZMPT101B (tegangan) dan ACS712 (arus), lalu mengirim data ke Backend melalui MQTT.

## Hardware Requirements

- ESP32 DevKit (atau varian lain)
- ZMPT101B - Sensor Tegangan AC
- ACS712 - Sensor Arus AC (30A recommended)
- Relay Module 2 Channel
- Power Supply 5V

## Wiring Diagram

```
ESP32 Pin      |  Component
---------------|---------------------------
GPIO34         |  ZMPT101B OUT
GPIO35         |  ACS712 OUT
GPIO26         |  Relay 1 IN
GPIO27         |  Relay 2 IN
3V3            |  ZMPT101B VCC, ACS712 VCC
GND            |  All GND
```

## Library Dependencies

Install melalui Arduino IDE Library Manager:

1. **PubSubClient** by Nick O'Leary (v2.8.0+)
2. **ArduinoJson** by Benoit Blanchon (v6.21.0+)

## Setup & Installation

### 1. Konfigurasi WiFi

Edit di file `cnc_monitor_mqtt.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Konfigurasi MQTT Broker

```cpp
const char* mqtt_server = "192.168.1.100";  // IP server backend
const int mqtt_port = 1883;
```

### 3. Kalibrasi Sensor (Optional)

Jika pembacaan sensor tidak akurat, sesuaikan konstanta berikut:

```cpp
#define TEGANGAN_SENSITIVITY 0.430  // ZMPT101B
#define ARUS_SENSITIVITY 0.066      // ACS712 30A
```

**Cara Kalibrasi:**
- Ukur tegangan/arus dengan multimeter
- Bandingkan dengan pembacaan ESP32
- Sesuaikan sensitivity hingga akurat

### 4. Upload ke ESP32

1. Buka `cnc_monitor_mqtt.ino` di Arduino IDE
2. Pilih Board: **ESP32 Dev Module**
3. Pilih Port yang sesuai
4. Klik **Upload**

## MQTT Topics

### Published by ESP32:

**Topic:** `cnc/sensor`  
**Interval:** 1 detik  
**Payload:**
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

**Topic:** `cnc/relay/status`  
**Trigger:** Saat menerima perintah relay  
**Payload:**
```json
{
  "channel": 1,
  "state": true,
  "timestamp": 12345678
}
```

### Subscribed by ESP32:

**Topic:** `cnc/relay/set`  
**Payload:**
```json
{
  "channel": 1,
  "state": true,
  "timestamp": 1697623421004
}
```

## Serial Monitor Output

Baud Rate: **115200**

```
=== CNC Energy Monitor - ESP32 ===
Connecting to WiFi: MyWiFi
..........
WiFi connected!
IP Address: 192.168.1.105
Connecting to MQTT broker: 192.168.1.100
MQTT connected!
Subscribed to: cnc/relay/set
Published: {"tegangan":220.5,"arus":1.15,"dayaVA":253.58,...}
MQTT message received [cnc/relay/set]: Relay command: channel=1, state=ON
Relay status published: {"channel":1,"state":true,"timestamp":12345}
```

## Troubleshooting

### WiFi tidak connect
- Pastikan SSID dan password benar
- Cek jarak ESP32 ke router
- Gunakan WiFi 2.4GHz (ESP32 tidak support 5GHz)

### MQTT tidak connect
- Pastikan backend/mosquitto sudah running
- Cek IP address backend benar
- Ping dari ESP32: gunakan Serial.println(WiFi.localIP())

### Sensor reading tidak akurat
- Kalibrasi ulang TEGANGAN_SENSITIVITY dan ARUS_SENSITIVITY
- Pastikan wiring correct
- Cek power supply stabil (3.3V untuk sensor)

### Relay tidak merespon
- Cek wiring relay module
- Pastikan relay module active LOW atau HIGH (sesuaikan di code)
- Test manual dengan digitalWrite()

## Safety Warning

⚠️ **PERINGATAN KESELAMATAN:**
- Bekerja dengan tegangan AC 220V sangat berbahaya
- Pastikan instalasi dilakukan oleh teknisi berpengalaman
- Gunakan isolasi yang proper
- Jangan menyentuh sirkuit saat powered
- Gunakan GFCI/ELCB untuk proteksi tambahan

## License

MIT
