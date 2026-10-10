'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { tokenStorage } from '@/lib/auth/token-storage';
import { socketTransport } from '@/lib/auth/socket-transport';
import { API_CONFIG } from '@/config/api.config';
import { useAuth } from '@/lib/auth';

interface TicketNotification {
  ticketId: string;
  ticket?: any;
  message?: any;
  timestamp: Date;
}

export function useTicketNotifications() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get auth token from localStorage or cookies
    const token = tokenStorage.getAccessToken();

    if (!token) {
      console.warn('No auth token found, WebSocket connection skipped');
      return;
    }

    // Connect to WebSocket server
    const transport = socketTransport('tickets', API_CONFIG.SOCKET_URL, () => tokenStorage.getAccessToken());
    const socket = io(transport.url, {
      auth: transport.auth,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Ticket events
    socket.on('ticket:created', (data: TicketNotification) => {
      toast.success('Yeni Ticket Oluşturuldu', {
        description: `Ticket #${data.ticketId} başarıyla oluşturuldu`,
      });
    });

    socket.on('ticket:assigned', (data: TicketNotification) => {
      toast.info('Ticket Atandı', {
        description: `Ticket #${data.ticketId} size atandı`,
      });
    });

    socket.on('ticket:message', (data: TicketNotification) => {
      toast.info('Yeni Mesaj', {
        description: `Ticket #${data.ticketId} için yeni mesaj alındı`,
      });
    });

    socket.on('ticket:status_changed', (data: TicketNotification) => {
      toast.info('Durum Değişti', {
        description: `Ticket #${data.ticketId} durumu güncellendi`,
      });
    });

    socket.on('ticket:priorityChanged', (data: TicketNotification) => {
      toast.warning('Öncelik Değişti', {
        description: `Ticket #${data.ticketId} önceliği güncellendi`,
      });
    });

    socket.on('ticket:sla_warning', (data: TicketNotification) => {
      toast.error('SLA Uyarısı', {
        description: `Ticket #${data.ticketId} için SLA yaklaşıyor!`,
        duration: 10000,
      });
    });

    socket.on('ticket:sla_breach', (data: TicketNotification) => {
      toast.error('SLA İhlali', {
        description: `Ticket #${data.ticketId} için SLA ihlal edildi!`,
        duration: 15000,
      });
    });

    socket.on('ticket:escalated', (data: TicketNotification) => {
      toast.error('Ticket Yükseltildi', {
        description: `Ticket #${data.ticketId} yöneticiye yükseltildi`,
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return {
    isConnected,
    socket: socketRef.current,
  };
}
