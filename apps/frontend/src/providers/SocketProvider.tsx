'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { tokenStorage } from '@/lib/auth/token-storage';
import { socketTransport } from '@/lib/auth/socket-transport';
import { API_CONFIG } from '@/config/api.config';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    lastEvent: any | null;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    lastEvent: null,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
    tenantId?: string;
    userId?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, tenantId, userId }) => {
    const { user } = useAuth();
    const verifiedTenant = user && 'tenantId' in user && typeof user.tenantId === 'string' ? user.tenantId : undefined;
    const verifiedUserId = user?.id;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<any | null>(null);

    useEffect(() => {
        if (!verifiedTenant || !verifiedUserId || !tokenStorage.getAccessToken() || (tenantId && tenantId !== verifiedTenant) || (userId && userId !== verifiedUserId)) return;
        const transport = socketTransport('notifications', API_CONFIG.SOCKET_URL, () => tokenStorage.getAccessToken(), verifiedTenant);
        const socketInstance = io(transport.url, {
            auth: transport.auth,
            transports: ['websocket'],
            autoConnect: true,
        });

        socketInstance.on('connect', () => {
            console.log('🔌 Socket Connected:', socketInstance.id);
            setIsConnected(true);

            // Join Tenant Room
            socketInstance.emit('join', { tenantId: verifiedTenant, userId: verifiedUserId });
        });

        socketInstance.on('disconnect', () => {
            console.log('🔌 Socket Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('notification', (payload) => {
            console.log('🔔 Notification Received:', payload);
            setLastEvent(payload);
        });

        // Specific event for insights (if we separate them)
        socketInstance.on('insight.generated', (payload) => {
            console.log('🧠 Insight Received:', payload);
            setLastEvent({ type: 'neural-insight', ...payload });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [tenantId, userId, verifiedTenant, verifiedUserId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, lastEvent }}>
            {children}
        </SocketContext.Provider>
    );
};
