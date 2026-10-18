/*
 * CONTOH KALIBRASI SENSOR
 * 
 * Gunakan sketch ini untuk kalibrasi sensor tegangan dan arus
 * Upload ke ESP32, buka Serial Monitor (115200 baud)
 * Bandingkan dengan multimeter untuk mendapatkan sensitivity yang tepat
 */

#include <Arduino.h>

#define PIN_TEGANGAN 34
#define PIN_ARUS 35
#define SAMPLES 1000
#define ADC_RESOLUTION 4095.0
#define ADC_VOLTAGE 3.3

// Sesuaikan nilai ini hingga pembacaan sesuai dengan multimeter
#define TEGANGAN_SENSITIVITY 0.430
#define ARUS_SENSITIVITY 0.066

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Kalibrasi Sensor ESP32 ===");
  pinMode(PIN_TEGANGAN, INPUT);
  pinMode(PIN_ARUS, INPUT);
}

void loop() {
  float tegangan = readTeganganRMS();
  float arus = readArusRMS();
  
  Serial.println("===================================");
  Serial.printf("Tegangan RMS: %.2f V\n", tegangan);
  Serial.printf("Arus RMS: %.2f A\n", arus);
  Serial.printf("Daya: %.2f VA\n", tegangan * arus);
  Serial.println("===================================");
  Serial.println();
  
  delay(2000);
}

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
  return rms / TEGANGAN_SENSITIVITY;
}

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
  return (arusAC < 0.1) ? 0.0 : arusAC;
}
