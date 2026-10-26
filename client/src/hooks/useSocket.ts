import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

// Custom hook for socket initialization (used in Tracking.tsx, Notifications.tsx)
const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = window.location.origin;
    const newSocket: Socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => console.log('Socket connected successfully'));
    newSocket.on('connect_error', (err) => console.warn('Socket connect error:', err.message));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty deps: Init once

  return socket;
};

export default useSocket;