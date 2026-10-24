import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useMessages } from '../../context/MessagesContext';
import { Screen } from '../../components/UI';
import { colors } from '../../theme';

const messageId = (message) => message._id?.toString();

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams();
  const { api, user } = useApp();
  const { socket, conversations, refreshConversations } = useMessages();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [peerOnline, setPeerOnline] = useState(false);
  const listRef = useRef(null);
  const conversation = useMemo(
    () => conversations.find((item) => item._id === conversationId),
    [conversations, conversationId],
  );

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/messages/conversations/${conversationId}/messages`);
      if (!data.success) throw new Error(data.message || 'Unable to load messages');
      setMessages(data.messages || []);
      await refreshConversations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load messages');
    } finally {
      setLoading(false);
    }
  }, [api, conversationId, refreshConversations]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    loadMessages();
  }, [loadMessages, user]);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;
    const handleMessage = (message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => current.some((item) => messageId(item) === messageId(message))
        ? current
        : [...current, message]);
      if ((message.senderId?._id || message.senderId) !== user?._id) {
        api.patch(`/api/messages/conversations/${conversationId}/read`)
          .then(() => refreshConversations())
          .catch((requestError) => console.warn('Unable to mark message read:', requestError.message));
      }
    };
    const handlePresence = ({ conversationId: eventId, userId, online }) => {
      if (eventId && eventId !== conversationId) return;
      if (userId === conversation?.otherUser?._id) setPeerOnline(Boolean(online));
    };
    const handleRead = ({ conversationId: eventId, readerId, readAt }) => {
      if (eventId !== conversationId || readerId === user?._id) return;
      setMessages((current) => current.map((message) => (
        message.senderId?._id === user?._id ? { ...message, readAt } : message
      )));
    };
    socket.on('message:new', handleMessage);
    socket.on('presence:status', handlePresence);
    socket.on('presence:changed', handlePresence);
    socket.on('messages:read', handleRead);
    socket.emit('conversation:join', { conversationId }, (result) => {
      if (!result?.success) setError(result?.message || 'Unable to join conversation');
    });
    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:new', handleMessage);
      socket.off('presence:status', handlePresence);
      socket.off('presence:changed', handlePresence);
      socket.off('messages:read', handleRead);
    };
  }, [api, conversation?.otherUser?._id, conversationId, refreshConversations, socket, user?._id]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/api/messages/conversations/${conversationId}/messages`, { content });
      if (!data.success) throw new Error(data.message || 'Unable to send message');
      setMessages((current) => current.some((item) => messageId(item) === messageId(data.message))
        ? current
        : [...current, data.message]);
      setDraft('');
      await refreshConversations();
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const peerName = conversation?.otherUser?.name || 'Conversation';

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}>
        <View style={{ minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to messages">
            <Text style={{ color: colors.blue, fontSize: 28 }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '800' }}>{peerName}</Text>
            <Text style={{ color: peerOnline ? colors.green : colors.muted, fontSize: 11, marginTop: 2 }}>{peerOnline ? 'Online' : 'Offline'}</Text>
          </View>
          {conversation?.productId ? (
            <Pressable onPress={() => router.push(`/product/${conversation.productId._id}`)} style={{ maxWidth: 145, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              {conversation.productId.image?.[0] ? <Image source={{ uri: conversation.productId.image[0] }} style={{ width: 36, height: 36, borderRadius: 7 }} /> : null}
              <Text numberOfLines={2} style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>View product</Text>
            </Pressable>
          ) : null}
        </View>

        {conversation?.productId ? (
          <Pressable onPress={() => router.push(`/product/${conversation.productId._id}`)} style={{ margin: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            {conversation.productId.image?.[0] ? <Image source={{ uri: conversation.productId.image[0] }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.paleBlue }} /> : null}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: colors.navy, fontWeight: '700' }}>{conversation.productId.name}</Text>
              <Text style={{ color: colors.green, marginTop: 3 }}>₹{conversation.productId.offerPrice ?? conversation.productId.price ?? '—'}</Text>
            </View>
            <Text style={{ color: colors.green, fontWeight: '700', fontSize: 12 }}>View</Text>
          </Pressable>
        ) : null}

        {loading ? <ActivityIndicator color={colors.blue} style={{ flex: 1 }} /> : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(message) => messageId(message)}
            contentContainerStyle={{ flexGrow: 1, padding: 14, gap: 9 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: 30 }}>Say hello to start the conversation.</Text>}
            renderItem={({ item }) => {
              if (item.type === 'order') {
                return <View style={{ alignSelf: 'center', maxWidth: '90%', padding: 10, borderRadius: 12, backgroundColor: colors.softGreen }}><Text style={{ color: colors.green, textAlign: 'center', fontSize: 12 }}>{item.content}</Text><Text style={{ color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</Text></View>;
              }
              const ownMessage = (item.senderId?._id || item.senderId) === user?._id;
              return (
                <View style={{ alignSelf: ownMessage ? 'flex-end' : 'flex-start', maxWidth: '82%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: ownMessage ? 16 : 6, backgroundColor: ownMessage ? '#DDF3E5' : colors.white }}>
                  <Text style={{ color: colors.ink, fontSize: 14 }}>{item.content}</Text>
                  <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {ownMessage ? ` · ${item.readAt ? 'Read' : 'Sent'}` : ''}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {error ? <View style={{ paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ flex: 1, color: colors.red, fontSize: 12 }}>{error}</Text><Text onPress={loadMessages} style={{ color: colors.blue, fontWeight: '700', marginLeft: 8 }}>Retry</Text></View> : null}

        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
            style={{ flex: 1, maxHeight: 110, minHeight: 42, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.border, color: colors.ink }}
          />
          <Pressable onPress={sendMessage} disabled={!draft.trim() || sending} style={{ minWidth: 65, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, opacity: !draft.trim() || sending ? 0.55 : 1 }}>
            <Text style={{ color: colors.white, fontWeight: '700' }}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
