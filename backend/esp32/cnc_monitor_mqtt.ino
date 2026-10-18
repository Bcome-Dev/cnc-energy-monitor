/*
 * CNC Energy Monitor - ESP32 Firmware dengan MQTT
 * 
 * Hardware:
 * - ESP32 DevKit
 * - ZMPT101B (Sensor Tegangan AC)
 * - ACS712 (Sensor Arus AC)
 * - Relay Module (2 channel)
 * 
 * Koneksi:
 * - ZMPT101B OUT -> GPIO34
 * - ACS712 OUT -> GPIO35
 * - Relay 1 -> GPIO26
 * - Relay 2 -> GPIO27
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===== KONFIGURASI WiFi =====
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ===== KONFIGURASI MQTT =====
const char* mqtt_server = "192.168.1.100";  // IP Backend/MQTT Broker
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_CNC_Monitor";

// MQTT Topics
const char* topic_sensor = "cnc/sensor";
const char* topic_relay_set = "cnc/relay/set";
const char* topic_relay_status = "cnc/relay/status";

// ===== PIN DEFINITIONS =====
#define PIN_TEGANGAN 34
#define PIN_ARUS 35
#define PIN_RELAY_1 26
#define PIN_RELAY_2 27

// ===== KALIBRASI SENSOR =====
#define TEGANGAN_OFFSET 512.0
#define TEGANGAN_SENSITIVITY 0.430  // Sesuaikan dengan sensor ZMPT101B
#define ARUS_OFFSET 512.0
#define ARUS_SENSITIVITY 0.066      // ACS712 30A: 0.066V/A

#define SAMPLES 1000
#define ADC_RESOLUTION 4095.0
#define ADC_VOLTAGE 3.3
#define POWER_FACTOR 0.85

// ===== GLOBAL VARIABLES =====
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastSensorRead = 0;
unsigned long lastMqttPublish = 0;
const unsigned long SENSOR_INTERVAL = 100;   // Baca sensor setiap 100ms
const unsigned long PUBLISH_INTERVAL = 1000; // Publish ke MQTT setiap 1 detik

// Relay states
bool relay1State = false;
bool relay2State = false;

// Sensor data
float tegangan = 0.0;
float arus = 0.0;
float dayaVA = 0.0;
float energiKWh = 0.0;
float energiAccumulator = 0.0;
bool peringatan = false;
bool sensorOk = true;

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== CNC Energy Monitor - ESP32 ===");
  
  // Setup GPIO
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, LOW);
  
  pinMode(PIN_TEGANGAN, INPUT);
  pinMode(PIN_ARUS, INPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Setup MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);
  
  Serial.println("Setup complete!");
}

// ===== MAIN LOOP =====
void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Read sensors periodically
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    readSensors();
  }
  
  // Publish data to MQTT
  if (millis() - lastMqttPublish >= PUBLISH_INTERVAL) {
    lastMqttPublish = millis();
    publishSensorData();
  }
}

// ===== WiFi CONNECTION =====
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ===== MQTT RECONNECT =====
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  Serial.print("Connecting to MQTT broker: ");
  Serial.println(mqtt_server);
  
  if (mqttClient.connect(mqtt_client_id)) {
    Serial.println("MQTT connected!");
    
    // Subscribe to relay command topic
    mqttClient.subscribe(topic_relay_set);
    Serial.print("Subscribed to: ");
    Serial.println(topic_relay_set);
    
  } else {
    Serial.print("MQTT connection failed, rc=");
    Serial.println(mqttClient.state());
  }
}

// ===== MQTT CALLBACK (Menerima perintah relay dari Backend) =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("MQTT message received [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // Parse JSON payload
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.println("JSON parsing failed!");
    return;
  }
  
  // Handle relay command
  if (strcmp(topic, topic_relay_set) == 0) {
    int channel = doc["channel"];
    bool state = doc["state"];
    
    Serial.printf("Relay command: channel=%d, state=%s\n", channel, state ? "ON" : "OFF");
    
    // Set relay
    if (channel == 1) {
      relay1State = state;
      digitalWrite(PIN_RELAY_1, state ? HIGH : LOW);
    } else if (channel == 2) {
      relay2State = state;
      digitalWrite(PIN_RELAY_2, state ? HIGH : LOW);
    }
    
    // Send confirmation back to backend
    publishRelayStatus(channel, state);
  }
}

// ===== READ SENSORS =====
void readSensors() {
  // Baca tegangan RMS (AC)
  float teganganRMS = readTeganganRMS();
  
  // Baca arus RMS (AC)
  float arusRMS = readArusRMS();
  
  // Hitung daya (VA)
  float daya = teganganRMS * arusRMS;
  
  // Akumulasi energi (kWh)
  // Energi = Power × Time
  float dt = PUBLISH_INTERVAL / 1000.0 / 3600.0; // Convert ms to hours
  energiAccumulator += (daya * dt / 1000.0); // Convert W to kW
  
  // Update global variables
  tegangan = teganganRMS;
  arus = arusRMS;
  dayaVA = daya;
  energiKWh = energiAccumulator;
  
  // Check for warnings
  peringatan = (tegangan < 190.0 || tegangan > 240.0 || arus > 25.0);
  
  // Check sensor health
  sensorOk = (tegangan > 0.0 && tegangan < 500.0);
}

// ===== READ TEGANGAN RMS =====
float readTeganganRMS() {
  float sum = 0.0;
  
  for (int i = 0; i < SAMPLES; i++) {
    int rawValue = analogRead(PIN_TEGANGAN);
    float voltage = (rawValue / ADC_RESOLUTION) * ADC_VOLTAGE;
    float centered = voltage - (ADC_VOLTAGE / 2.0);
    sum += centered * centered;
    delayMicroseconds(100);
  }
  
  float rms = sqrt(sum / SAMPLES);
  float teganganAC = rms / TEGANGAN_SENSITIVITY;
  
  return teganganAC;
}

// ===== READ ARUS RMS =====
float readArusRMS() {
  float sum = 0.0;
  
  for (int i = 0; i < SAMPLES; i++) {
    int rawValue = analogRead(PIN_ARUS);
    float voltage = (rawValue / ADC_RESOLUTION) * ADC_VOLTAGE;
    float centered = voltage - (ADC_VOLTAGE / 2.0);
    sum += centered * centered;
    delayMicroseconds(100);
  }
  
  float rms = sqrt(sum / SAMPLES);
  float arusAC = rms / ARUS_SENSITIVITY;
  
  // Filter noise (jika arus sangat kecil, anggap 0)
  if (arusAC < 0.1) {
    arusAC = 0.0;
  }
  
  return arusAC;
}

// ===== PUBLISH SENSOR DATA KE MQTT =====
void publishSensorData() {
  if (!mqttClient.connected()) {
    return;
  }
  
  // Buat JSON payload sesuai format yang diminta
  StaticJsonDocument<256> doc;
  doc["tegangan"] = roundf(tegangan * 10) / 10.0;
  doc["arus"] = roundf(arus * 100) / 100.0;
  doc["dayaVA"] = roundf(dayaVA * 100) / 100.0;
  doc["energiKWh"] = roundf(energiKWh * 1000) / 1000.0;
  doc["relayAktif"] = relay1State || relay2State;
  doc["peringatan"] = peringatan;
  doc["sensorOk"] = sensorOk;
  
  // Serialize to string
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  // Publish to MQTT
  if (mqttClient.publish(topic_sensor, jsonBuffer, false)) {
    Serial.print("Published: ");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Publish failed!");
  }
}

// ===== PUBLISH RELAY STATUS (Konfirmasi ke Backend) =====
void publishRelayStatus(int channel, bool state) {
  if (!mqttClient.connected()) {
    return;
  }
  
  StaticJsonDocument<128> doc;
  doc["channel"] = channel;
  doc["state"] = state;
  doc["timestamp"] = millis();
  
  char jsonBuffer[128];
  serializeJson(doc, jsonBuffer);
  
  mqttClient.publish(topic_relay_status, jsonBuffer, false);
  Serial.print("Relay status published: ");
  Serial.println(jsonBuffer);
}
