import mqtt from 'mqtt';
import database from '../database/connection.js';
import { broadcast } from '../websocket/server.js';

class MQTTHandler {
  constructor() {
    this.client = null;
    this.connected = false;
    this.topics = {
      sensor: process.env.MQTT_TOPIC_SENSOR || 'cnc/sensor',
      relaySet: process.env.MQTT_TOPIC_RELAY_SET || 'cnc/relay/set',
      relayStatus: process.env.MQTT_TOPIC_RELAY_STATUS || 'cnc/relay/status'
    };
  }

  async connect() {
    const brokerUrl = `mqtt://${process.env.MQTT_BROKER || 'localhost'}:${process.env.MQTT_PORT || 1883}`;
    
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `cnc-backend-${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Connected to broker:', brokerUrl);
        this.connected = true;

        // Subscribe to sensor topic
        this.client.subscribe(this.topics.sensor, (err) => {
          if (err) {
            console.error('[MQTT] Subscribe error:', err);
          } else {
            console.log(`[MQTT] Subscribed to topic: ${this.topics.sensor}`);
          }
        });

        // Subscribe to relay status topic (konfirmasi dari ESP32)
        this.client.subscribe(this.topics.relayStatus, (err) => {
          if (err) {
            console.error('[MQTT] Subscribe error:', err);
          } else {
            console.log(`[MQTT] Subscribed to topic: ${this.topics.relayStatus}`);
          }
        });

        resolve();
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        console.error('[MQTT] Connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.client.on('offline', () => {
        console.log('[MQTT] Client offline');
        this.connected = false;
        database.updateDeviceStatus(false).catch(console.error);
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting...');
      });
    });
  }

  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());

      if (topic === this.topics.sensor) {
        await this.handleSensorData(payload);
      } else if (topic === this.topics.relayStatus) {
        await this.handleRelayStatus(payload);
      }
    } catch (error) {
      console.error(`[MQTT] Error handling message from ${topic}:`, error.message);
    }
  }

  async handleSensorData(data) {
    // Validate data structure
    if (!this.isValidSensorData(data)) {
      console.error('[MQTT] Invalid sensor data format:', data);
      return;
    }

    try {
      // Insert ke database
      const result = await database.insertSensorData(data);
      
      // Update device status (ESP32 online)
      await database.updateDeviceStatus(true);

      // Broadcast ke WebSocket clients (Frontend)
      const wsPayload = {
        type: 'sensor_data',
        data: {
          ...data,
          id: result.id,
          timestamp: result.timestamp
        }
      };
      broadcast(wsPayload);

      console.log(`[MQTT] Sensor data saved: ID=${result.id}`);
    } catch (error) {
      console.error('[MQTT] Error processing sensor data:', error.message);
    }
  }

  async handleRelayStatus(data) {
    // ESP32 mengirim konfirmasi relay command
    console.log('[MQTT] Relay status received:', data);
    
    try {
      // Broadcast relay status ke Frontend
      broadcast({
        type: 'relay_status',
        data: data
      });
    } catch (error) {
      console.error('[MQTT] Error processing relay status:', error.message);
    }
  }

  isValidSensorData(data) {
    return (
      typeof data.tegangan === 'number' &&
      typeof data.arus === 'number' &&
      typeof data.dayaVA === 'number' &&
      typeof data.energiKWh === 'number' &&
      typeof data.relayAktif === 'boolean' &&
      typeof data.peringatan === 'boolean' &&
      typeof data.sensorOk === 'boolean'
    );
  }

  // Publish relay command ke ESP32
  async publishRelayCommand(channel, state) {
    if (!this.connected) {
      throw new Error('MQTT client not connected');
    }

    const payload = JSON.stringify({
      channel: channel,
      state: state,
      timestamp: Date.now()
    });

    return new Promise((resolve, reject) => {
      this.client.publish(this.topics.relaySet, payload, { qos: 1 }, (error) => {
        if (error) {
          console.error('[MQTT] Publish error:', error);
          reject(error);
        } else {
          console.log(`[MQTT] Published relay command: channel=${channel}, state=${state}`);
          resolve();
        }
      });
    });
  }

  async disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('[MQTT] Disconnected from broker');
    }
  }

  isConnected() {
    return this.connected;
  }
}

const mqttHandler = new MQTTHandler();
export default mqttHandler;
