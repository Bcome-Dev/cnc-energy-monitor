import { wss } from '../index.js';

// Broadcast message to all connected WebSocket clients
export function broadcast(message) {
  if (!wss) {
    console.warn('[WebSocket] WSS not initialized yet');
    return;
  }

  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  
  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(payload);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`[WebSocket] Broadcasted to ${sentCount} client(s)`);
  }
}
