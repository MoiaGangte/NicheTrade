import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import './Messages.css';

const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const today = new Date();
    return date.toDateString() === today.toDateString()
        ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const messageId = (message) => message._id?.toString();

export default function Messages() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user, isUserLoading, setShowUserLogin, axios } = useAppContext();
    const { socket, conversations, refreshConversations } = useChat();
    const [search, setSearch] = useState('');
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [peerOnline, setPeerOnline] = useState(false);
    const bottomRef = useRef(null);

    const activeConversation = useMemo(
        () => conversations.find((conversation) => conversation._id === conversationId),
        [conversations, conversationId],
    );
    const filteredConversations = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return conversations;
        return conversations.filter((conversation) => (
            `${conversation.otherUser?.name || ''} ${conversation.productId?.name || ''} ${conversation.lastMessageText || ''}`
                .toLocaleLowerCase()
                .includes(query)
        ));
    }, [conversations, search]);

    const loadMessages = useCallback(async () => {
        if (!conversationId || !user) {
            setMessages([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get(`/api/messages/conversations/${conversationId}/messages`);
            if (!data.success) throw new Error(data.message || 'Unable to load messages');
            setMessages(data.messages || []);
            await refreshConversations();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Unable to load messages');
        } finally {
            setLoading(false);
        }
    }, [axios, conversationId, refreshConversations, user]);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            setShowUserLogin(true);
            navigate('/', { replace: true });
            return;
        }
        refreshConversations().catch((requestError) => {
            console.error('Unable to load conversations:', requestError);
            toast.error(requestError.response?.data?.message || 'Unable to load conversations');
        });
    }, [isUserLoading, navigate, refreshConversations, setShowUserLogin, user]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        if (!socket || !conversationId) return undefined;
        const handleMessage = (message) => {
            if (message.conversationId !== conversationId) return;
            setMessages((current) => (
                current.some((item) => messageId(item) === messageId(message))
                    ? current
                    : [...current, message]
            ));
            if ((message.senderId?._id || message.senderId) !== user._id) {
                axios.patch(`/api/messages/conversations/${conversationId}/read`)
                    .then(() => refreshConversations())
                    .catch((requestError) => console.error('Unable to mark message read:', requestError));
            }
        };
        const handlePresence = ({ conversationId: eventConversationId, userId: peerId, online }) => {
            if (eventConversationId && eventConversationId !== conversationId) return;
            if (activeConversation?.otherUser?._id === peerId) setPeerOnline(Boolean(online));
        };
        const handleRead = ({ conversationId: eventConversationId, readerId, readAt }) => {
            if (eventConversationId !== conversationId || readerId === user._id) return;
            setMessages((current) => current.map((message) => (
                (message.senderId?._id || message.senderId) === user._id
                    ? { ...message, readAt }
                    : message
            )));
        };
        socket.on('message:new', handleMessage);
        socket.on('presence:status', handlePresence);
        socket.on('presence:changed', handlePresence);
        socket.on('messages:read', handleRead);
        socket.emit('conversation:join', { conversationId }, (result) => {
            if (!result?.success) {
                setError(result?.message || 'Unable to join this conversation');
            }
        });
        return () => {
            socket.emit('conversation:leave', { conversationId });
            socket.off('message:new', handleMessage);
            socket.off('presence:status', handlePresence);
            socket.off('presence:changed', handlePresence);
            socket.off('messages:read', handleRead);
        };
    }, [activeConversation?.otherUser?._id, axios, conversationId, refreshConversations, socket, user]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const sendMessage = async () => {
        const content = draft.trim();
        if (!content || sending || !conversationId) return;
        setSending(true);
        setError('');
        try {
            const { data } = await axios.post(`/api/messages/conversations/${conversationId}/messages`, { content });
            if (!data.success) throw new Error(data.message || 'Unable to send message');
            setMessages((current) => (
                current.some((item) => messageId(item) === messageId(data.message))
                    ? current
                    : [...current, data.message]
            ));
            setDraft('');
            await refreshConversations();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Unable to send message');
        } finally {
            setSending(false);
        }
    };

    const handleComposerKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    if (isUserLoading || !user) {
        return <main className="messages-page"><div className="messages-loading">Checking your account…</div></main>;
    }

    return (
        <main className={`messages-page ${conversationId ? 'has-active-chat' : ''}`}>
            <aside className="messages-inbox">
                <header className="messages-inbox-header">
                    <div>
                        <h1>Messages</h1>
                        <p>Buyer and seller conversations</p>
                    </div>
                    <span className="messages-total">{conversations.length}</span>
                </header>
                <label className="messages-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search messages"
                        aria-label="Search conversations"
                    />
                </label>
                <div className="messages-conversation-list">
                    {filteredConversations.map((conversation) => (
                        <Link
                            key={conversation._id}
                            to={`/messages/${conversation._id}`}
                            className={`messages-conversation ${conversation._id === conversationId ? 'selected' : ''}`}
                        >
                            <div className="messages-avatar">{conversation.otherUser?.name?.[0]?.toUpperCase() || 'N'}</div>
                            <div className="messages-conversation-copy">
                                <div className="messages-conversation-title">
                                    <strong>{conversation.otherUser?.name || 'NicheTrade member'}</strong>
                                    <time>{formatTime(conversation.lastMessageAt)}</time>
                                </div>
                                <p className="messages-product-title">
                                    {conversation.productId?.name || 'Listing unavailable'}
                                    {conversation.productId?.offerPrice != null ? ` · ₹${conversation.productId.offerPrice}` : ''}
                                </p>
                                <p className="messages-last-message">{conversation.lastMessageText || 'Conversation started'}</p>
                            </div>
                            {conversation.productId?.image?.[0] ? (
                                <img className="messages-listing-thumb" src={conversation.productId.image[0]} alt="" />
                            ) : null}
                            {conversation.unreadCount > 0 ? <span className="messages-unread">{conversation.unreadCount}</span> : null}
                        </Link>
                    ))}
                    {!filteredConversations.length ? (
                        <div className="messages-empty">
                            {search ? 'No conversations match your search.' : 'No messages yet. Open a listing and chat with its seller.'}
                        </div>
                    ) : null}
                </div>
            </aside>

            {conversationId ? (
                <section className="messages-chat">
                    {activeConversation ? (
                        <>
                            <header className="messages-chat-header">
                                <Link to="/messages" className="messages-back" aria-label="Back to conversations">‹</Link>
                                <div className="messages-avatar">{activeConversation.otherUser?.name?.[0]?.toUpperCase() || 'N'}</div>
                                <div className="messages-peer">
                                    <strong>{activeConversation.otherUser?.name || 'NicheTrade member'}</strong>
                                    <span className={peerOnline ? 'online' : ''}>{peerOnline ? 'Online' : 'Offline'}</span>
                                </div>
                                <Link className="messages-product-link" to={`/products/${activeConversation.productId?.category || 'all'}/${activeConversation.productId?._id}`}>
                                    View product
                                </Link>
                            </header>
                            <div className="messages-product-card">
                                {activeConversation.productId?.image?.[0] ? (
                                    <img src={activeConversation.productId.image[0]} alt="" />
                                ) : <div className="messages-product-placeholder">N</div>}
                                <div>
                                    <strong>{activeConversation.productId?.name || 'Listing unavailable'}</strong>
                                    <span>₹{activeConversation.productId?.offerPrice ?? activeConversation.productId?.price ?? '—'}</span>
                                </div>
                            </div>
                            <div className="messages-history" aria-live="polite">
                                {loading ? <div className="messages-state">Loading conversation…</div> : null}
                                {!loading && !messages.length ? <div className="messages-state">Say hello to start the conversation.</div> : null}
                                {!loading && messages.map((message) => {
                                    if (message.type === 'order') {
                                        return <div key={message._id} className="messages-order-notice">{message.content} <time>{formatTime(message.createdAt)}</time></div>;
                                    }
                                    const ownMessage = message.senderId?._id === user._id || message.senderId === user._id;
                                    return (
                                        <div key={message._id} className={`messages-row ${ownMessage ? 'own' : ''}`}>
                                            <div className="messages-bubble">
                                                <p>{message.content}</p>
                                                <time>
                                                    {formatTime(message.createdAt)}
                                                    {ownMessage ? ` · ${message.readAt ? 'Read' : 'Sent'}` : ''}
                                                </time>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>
                            {error ? <div className="messages-error" role="alert">{error} <button onClick={loadMessages}>Retry</button></div> : null}
                            <form className="messages-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={handleComposerKeyDown}
                                    placeholder="Write a message…"
                                    maxLength={2000}
                                    aria-label="Write a message"
                                    rows={1}
                                />
                                <button disabled={!draft.trim() || sending} type="submit">{sending ? 'Sending…' : 'Send'}</button>
                            </form>
                        </>
                    ) : (
                        <div className="messages-state">{error || 'Loading conversation…'}</div>
                    )}
                </section>
            ) : (
                <section className="messages-chat messages-no-selection">
                    <div className="messages-empty-illustration">✉</div>
                    <h2>Your messages</h2>
                    <p>Choose a conversation to continue chatting.</p>
                </section>
            )}
        </main>
    );
}
