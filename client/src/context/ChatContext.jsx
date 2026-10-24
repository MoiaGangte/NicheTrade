import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from './AppContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const { user, axios } = useAppContext();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshConversations = useCallback(async () => {
        if (!user) {
            setConversations([]);
            setUnreadCount(0);
            return [];
        }
        const { data } = await axios.get('/api/messages/conversations');
        if (!data.success) throw new Error(data.message || 'Unable to load conversations');
        const nextConversations = data.conversations || [];
        setConversations(nextConversations);
        setUnreadCount(nextConversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0));
        return nextConversations;
    }, [axios, user]);

    useEffect(() => {
        let active = true;
        if (!user) {
            setSocket(null);
            setConversations([]);
            setUnreadCount(0);
            return undefined;
        }

        const token = localStorage.getItem('token');
        if (!token) return undefined;

        const socketUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
        const connection = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });
        setSocket(connection);

        const refresh = () => {
            if (active) refreshConversations().catch((error) => {
                console.error('Unable to refresh messages:', error);
            });
        };
        connection.on('connect', refresh);
        connection.on('conversation:updated', refresh);
        connection.on('message:new', refresh);
        refresh();

        return () => {
            active = false;
            connection.disconnect();
            setSocket(null);
        };
    }, [user, refreshConversations]);

    const value = useMemo(() => ({
        socket,
        conversations,
        unreadCount,
        refreshConversations,
    }), [socket, conversations, unreadCount, refreshConversations]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const value = useContext(ChatContext);
    if (!value) throw new Error('useChat must be used inside ChatProvider');
    return value;
}
