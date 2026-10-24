import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, getStoredToken, TOKEN_KEY } from '../api';
import { useApp } from './AppContext';

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const { api, user } = useApp();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setUnreadCount(0);
      return [];
    }
    const { data } = await api.get('/api/messages/conversations');
    if (!data.success) throw new Error(data.message || 'Unable to load conversations');
    const next = data.conversations || [];
    setConversations(next);
    setUnreadCount(next.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0));
    return next;
  }, [api, user]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setSocket(null);
      setConversations([]);
      setUnreadCount(0);
      return undefined;
    }

    let connection;
    getStoredToken(TOKEN_KEY).then((token) => {
      if (!active || !token) return;
      connection = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      setSocket(connection);
      const refresh = () => {
        if (active) refreshConversations().catch((error) => {
          console.warn('Unable to refresh messages:', error.response?.data?.message || error.message);
        });
      };
      connection.on('connect', refresh);
      connection.on('conversation:updated', refresh);
      connection.on('message:new', refresh);
      connection.on('connect_error', (error) => {
        console.warn('Live messages unavailable:', error.message);
      });
      refresh();
    }).catch((error) => {
      console.warn('Unable to initialize messages connection:', error.message);
    });

    return () => {
      active = false;
      connection?.disconnect();
      setSocket(null);
    };
  }, [refreshConversations, user]);

  const value = useMemo(() => ({
    socket,
    conversations,
    unreadCount,
    refreshConversations,
  }), [socket, conversations, unreadCount, refreshConversations]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const value = useContext(MessagesContext);
  if (!value) throw new Error('useMessages must be used inside MessagesProvider');
  return value;
}
