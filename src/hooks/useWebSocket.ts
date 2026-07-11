import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

interface UseWebSocketOptions {
    url: string | null;
    token?: string | null;
    onMessage?: (data: string) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: any) => void;
    autoConnect?: boolean;
}

export function useWebSocket({ url, token, onMessage, onOpen, onClose, onError, autoConnect = true }: UseWebSocketOptions) {
    const [state, setState] = useState<WebSocketState>('DISCONNECTED');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const messageQueueRef = useRef<string[]>([]);

    const clearTimers = useCallback(() => {
        if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
        if (pingTimerRef.current) { clearInterval(pingTimerRef.current); pingTimerRef.current = null; }
    }, []);

    const flushQueue = useCallback(() => {
        while (messageQueueRef.current.length > 0) {
            const msg = messageQueueRef.current.shift();
            if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(msg!);
            else { messageQueueRef.current.unshift(msg!); break; }
        }
    }, []);

    const startPing = useCallback(() => {
        pingTimerRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }, 30000);
    }, []);

    const connect = useCallback(() => {
        if (!url) return;
        clearTimers();
        setState(reconnectAttemptsRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');
        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;
            ws.onopen = () => {
                setState('CONNECTED');
                reconnectAttemptsRef.current = 0;
                if (token) ws.send(JSON.stringify({ type: 'auth', token }));
                flushQueue();
                startPing();
                onOpen?.();
            };
            ws.onclose = () => {
                clearTimers();
                setState('DISCONNECTED');
                onClose?.();
                if (url) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) + Math.random() * 1000;
                    reconnectAttemptsRef.current++;
                    reconnectTimerRef.current = setTimeout(() => connect(), delay);
                }
            };
            ws.onerror = (error) => onError?.(error);
            ws.onmessage = (event) => onMessage?.(event.data);
        } catch (error) {
            onError?.(error);
            if (url) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) + Math.random() * 1000;
                reconnectAttemptsRef.current++;
                reconnectTimerRef.current = setTimeout(() => connect(), delay);
            }
        }
    }, [url, token, onMessage, onOpen, onClose, onError, clearTimers, flushQueue, startPing]);

    const disconnect = useCallback(() => {
        clearTimers();
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        reconnectAttemptsRef.current = 0;
        messageQueueRef.current = [];
        if (wsRef.current) {
            wsRef.current.onopen = null; wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.onmessage = null;
            wsRef.current.close(); wsRef.current = null;
        }
        setState('DISCONNECTED');
    }, [clearTimers]);

    const send = useCallback((data: any) => {
        const msg = typeof data === 'string' ? data : JSON.stringify(data);
        if (wsRef.current?.readyState === WebSocket.OPEN) { wsRef.current.send(msg); return true; }
        messageQueueRef.current.push(msg); return false;
    }, []);

    useEffect(() => { if (autoConnect && url) connect(); return () => disconnect(); }, [url, autoConnect]);
    return { state, connect, disconnect, send, isConnected: state === 'CONNECTED' };
}
