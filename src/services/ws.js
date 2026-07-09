const DISCONNECTED = 'DISCONNECTED';
const CONNECTING = 'CONNECTING';
const CONNECTED = 'CONNECTED';
const RECONNECTING = 'RECONNECTING';

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;
const PING_INTERVAL = 30000;

let ws = null;
let currentState = DISCONNECTED;
let wsUrl = null;
let wsToken = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let pingTimer = null;
let messageQueue = [];
let callbacks = {};

function getState() {
  return currentState;
}

function setState(newState) {
  currentState = newState;
  if (callbacks.onStateChange) {
    callbacks.onStateChange(currentState);
  }
}

function setCallbacks(newCallbacks) {
  callbacks = { ...callbacks, ...newCallbacks };
}

function getReconnectDelay() {
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY
  );
  const jitter = Math.random() * 1000;
  return Math.floor(delay + jitter);
}

function clearTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function startPing() {
  stopPing();
  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, PING_INTERVAL);
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function flushQueue() {
  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      messageQueue.unshift(message);
      break;
    }
  }
}

function send(data) {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    return true;
  }
  messageQueue.push(message);
  return false;
}

function createWebSocket(isReconnect) {
  if (!wsUrl) return;

  clearTimers();
  setState(isReconnect ? RECONNECTING : CONNECTING);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setState(CONNECTED);
      reconnectAttempts = 0;

      if (wsToken) {
        ws.send(JSON.stringify({ type: 'auth', token: wsToken }));
      }

      flushQueue();
      startPing();

      if (callbacks.onOpen) {
        callbacks.onOpen();
      }
    };

    ws.onclose = () => {
      const wasConnected = currentState === CONNECTED;
      clearTimers();
      setState(DISCONNECTED);

      if (callbacks.onClose) {
        callbacks.onClose();
      }

      if (wasConnected && wsUrl) {
        scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    };

    ws.onmessage = (event) => {
      if (callbacks.onMessage) {
        callbacks.onMessage(event.data);
      }
    };
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  clearTimers();
  setState(RECONNECTING);
  const delay = getReconnectDelay();
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => createWebSocket(true), delay);
}

function connect(newUrl, authToken) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  wsUrl = newUrl;
  wsToken = authToken || null;
  reconnectAttempts = 0;
  createWebSocket(false);
}

function disconnect() {
  clearTimers();
  reconnectAttempts = 0;
  messageQueue = [];
  if (ws) {
    ws.onopen = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
  setState(DISCONNECTED);
}

function initWebSocket(authToken, socketUrl) {
  if (authToken && socketUrl) {
    connect(socketUrl, authToken);
  }
}

const wsService = {
  connect,
  disconnect,
  send,
  getState,
  setCallbacks,
  initWebSocket,
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  RECONNECTING,
};

export default wsService;
export {
  connect,
  disconnect,
  send,
  getState,
  setCallbacks,
  initWebSocket,
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  RECONNECTING,
};
