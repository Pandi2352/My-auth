import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useAuditSocket() {
  const [logs, setLogs] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(`${SOCKET_URL}/audit`, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to audit socket');
      socketRef.current?.emit('subscribe-to-feed');
    });

    socketRef.current.on('new-log', (log: any) => {
      setLogs((prev) => [log, ...prev].slice(0, 50)); // Keep last 50
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { logs, socket: socketRef.current };
}
