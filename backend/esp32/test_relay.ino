/*
 * TEST RELAY MODULE
 * 
 * Upload sketch ini untuk testing relay module
 * Relay akan menyala bergantian setiap 2 detik
 */

#define PIN_RELAY_1 26
#define PIN_RELAY_2 27

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Test Relay Module ===");
  
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  
  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, LOW);
}

void loop() {
  Serial.println("Relay 1 ON, Relay 2 OFF");
  digitalWrite(PIN_RELAY_1, HIGH);
  digitalWrite(PIN_RELAY_2, LOW);
  delay(2000);
  
  Serial.println("Relay 1 OFF, Relay 2 ON");
  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, HIGH);
  delay(2000);
  
  Serial.println("Both OFF");
  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, LOW);
  delay(2000);
  
  Serial.println("Both ON");
  digitalWrite(PIN_RELAY_1, HIGH);
  digitalWrite(PIN_RELAY_2, HIGH);
  delay(2000);
}
