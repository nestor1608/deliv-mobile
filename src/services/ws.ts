// WebSocket service with class-based API for backward compatibility
import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private messageQueue: string[] = [];

  private onMessageCallback?: (data: string) => void;
  private onOpenCallback?: () => void;
  private onErrorCallback?: (error: any) => void;
  private onCloseCallback?: () => void;

  connect(url: string, token?: string | null): void {
    this.url = url;
    this.token = token || null;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.url) return;
    this.clearTimers();
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.token) {
          this.ws?.send(JSON.stringify({ type: 'auth', token: this.token }));
        }
        this.flushQueue();
        this.startPing();
        this.onOpenCallback?.();
      };
      this.ws.onclose = () => {
        this.clearTimers();
        this.onCloseCallback?.();
        if (this.url) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) + Math.random() * 1000;
          this.reconnectAttempts++;
          this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
        }
      };
      this.ws.onerror = (error) => this.onErrorCallback?.(error);
      this.ws.onmessage = (event) => this.onMessageCallback?.(event.data);
    } catch (error) {
      this.onErrorCallback?.(error);
      if (this.url) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) + Math.random() * 1000;
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
      }
    }
  }

  disconnect(): void {
    this.clearTimers();
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.messageQueue.push(msg);
    }
  }

  setCallbacks(callbacks: {
    onMessage?: (data: string) => void;
    onOpen?: () => void;
    onError?: (error: any) => void;
    onClose?: () => void;
  }): void {
    this.onMessageCallback = callbacks.onMessage;
    this.onOpenCallback = callbacks.onOpen;
    this.onErrorCallback = callbacks.onError;
    this.onCloseCallback = callbacks.onClose;
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(msg!);
      } else {
        this.messageQueue.unshift(msg!);
        break;
      }
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }
}

// Singleton instance for backward compatibility
const wsService = new WebSocketService();

export { wsService, WebSocketService };
export default wsService;
