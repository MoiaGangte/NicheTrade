import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useMessages } from '../../context/MessagesContext';
import { EmptyState, Screen } from '../../components/UI';
import { colors } from '../../theme';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function MessagesInboxScreen() {
  const { user } = useApp();
  const { conversations, refreshConversations } = useMessages();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    refreshConversations()
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message))
      .finally(() => setLoading(false));
  }, [refreshConversations, user]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = conversations.filter((conversation) => (
    `${conversation.otherUser?.name || ''} ${conversation.productId?.name || ''} ${conversation.lastMessageText || ''}`
      .toLocaleLowerCase()
      .includes(normalizedSearch)
  ));

  return (
    <Screen>
      <View style={{ padding: 17, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '800' }}>Messages</Text>
            <Text style={{ color: colors.muted, marginTop: 3 }}>Chat with buyers and sellers</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/orders')}
            style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.blue, fontWeight: '700' }}>Orders</Text>
          </Pressable>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations"
          placeholderTextColor={colors.muted}
          style={{ marginTop: 14, paddingHorizontal: 13, height: 46, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.ink }}
        />
      </View>
      {loading ? <ActivityIndicator color={colors.blue} style={{ marginTop: 30 }} /> : error ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: colors.red, textAlign: 'center' }}>{error}</Text>
          <Text onPress={() => { setLoading(true); setError(''); refreshConversations().catch((e) => setError(e.message)).finally(() => setLoading(false)); }} style={{ color: colors.blue, textAlign: 'center', marginTop: 10, fontWeight: '700' }}>Retry</Text>
        </View>
      ) : !filtered.length ? (
        <EmptyState title={search ? 'No matching conversations' : 'No messages yet'} detail="Open a product listing and message its seller to start a conversation." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
          {filtered.map((conversation) => (
            <Pressable
              key={conversation._id}
              onPress={() => router.push(`/messages/${conversation._id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, marginBottom: 8, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softGreen }}>
                <Text style={{ color: colors.green, fontWeight: '800', fontSize: 18 }}>{conversation.otherUser?.name?.[0]?.toUpperCase() || 'N'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.navy, fontWeight: '700' }}>{conversation.otherUser?.name || 'NicheTrade member'}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>{formatTime(conversation.lastMessageAt)}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: colors.green, fontSize: 12, marginTop: 3 }}>{conversation.productId?.name || 'Listing unavailable'}{conversation.productId?.offerPrice != null ? ` · ₹${conversation.productId.offerPrice}` : ''}</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{conversation.lastMessageText || 'Conversation started'}</Text>
              </View>
              {conversation.unreadCount > 0 ? <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green }}><Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{conversation.unreadCount}</Text></View> : null}
              {conversation.productId?.image?.[0] ? <Image source={{ uri: conversation.productId.image[0] }} style={{ width: 44, height: 44, borderRadius: 9, backgroundColor: colors.paleBlue }} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
