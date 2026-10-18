// Update file ini untuk menghubungkan ke Backend real (bukan mock lagi)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

let ws = null;
let wsCallbacks = [];

// ===== WEBSOCKET CONNECTION =====
export function connectWebSocket(onMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] Already connected');
    return ws;
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WebSocket] Connected to backend');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', data);
      
      // Call all registered callbacks
      wsCallbacks.forEach(callback => callback(data));
      if (onMessage) onMessage(data);
    } catch (error) {
      console.error('[WebSocket] Parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };

  ws.onclose = () => {
    console.log('[WebSocket] Disconnected. Reconnecting in 3s...');
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  return ws;
}

export function registerWSCallback(callback) {
  wsCallbacks.push(callback);
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
  wsCallbacks = [];
}

// ===== REST API FUNCTIONS =====

// Get latest monitoring data
export async function getMonitoring() {
  try {
    const response = await fetch(`${API_BASE_URL}/monitoring`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('[API] getMonitoring error:', error);
    throw new Error(error.message || 'ESP32 offline');
  }
}

// Get sensor history
export async function getHistory(startTime, endTime, limit = 1000) {
  try {
    const params = new URLSearchParams();
    if (startTime) params.append('start', startTime);
    if (endTime) params.append('end', endTime);
    if (limit) params.append('limit', limit);

    const response = await fetch(`${API_BASE_URL}/history?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('[API] getHistory error:', error);
    throw error;
  }
}

// Get connection status
export async function getConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/connection`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    return {
      online: result.online,
      lastSeen: result.lastSeen,
      relays: {
        1: { on: false, at: Date.now() },
        2: { on: false, at: Date.now() }
      }
    };
  } catch (error) {
    console.error('[API] getConnection error:', error);
    throw error;
  }
}

// Send relay command
export async function sendRelayCommand(channel, on) {
  try {
    const response = await fetch(`${API_BASE_URL}/relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        state: on
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Relay command failed');
    }

    const result = await response.json();
    return {
      ch: result.data.channel,
      on: result.data.state,
      confirmedAt: new Date(result.data.timestamp).getTime()
    };
  } catch (error) {
    console.error('[API] sendRelayCommand error:', error);
    throw new Error(error.message || 'Perangkat offline, perintah tidak terkirim');
  }
}

// Get settings (localStorage only)
export async function getSettings() {
  try {
    const stored = localStorage.getItem('cnc-settings');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save settings (localStorage only)
export async function saveSettings(settings) {
  localStorage.setItem('cnc-settings', JSON.stringify(settings));
  return settings;
}
