import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

// Custom hook for socket initialization (used in Tracking.tsx, Notifications.tsx)
const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket: Socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: localStorage.getItem('token') }, // Auth per docs
    });

    newSocket.on('connect', () => console.log('Socket connected'));
    newSocket.on('error', (err) => console.error('Socket error:', err));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty deps: Init once

  return socket;
};

export default useSocket;