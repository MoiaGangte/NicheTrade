import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/UI';
import { colors, shadow } from '../theme';

const footerLinks = [
  {
    title: 'About Us',
    icon: '✦',
    links: [
      { text: 'Developer Team', page: 'developer-team' },
      { text: 'Admin Regulation', page: 'regulation' },
      { text: 'Objective', page: 'objective' },
      { text: 'Documentation', page: 'documentation' },
    ],
  },
  {
    title: 'Follow Us',
    icon: '↗',
    links: [
      { text: 'Instagram', url: 'https://www.instagram.com/nicheuniversityonline?mdxt=dmlrcmxraHZ2czFl' },
      { text: 'Facebook', url: 'https://www.facebook.com/share/g/1b4ohpdMJ2/' },
      { text: 'Website', url: 'https://www.niuniv.com/' },
      { text: 'YouTube', url: 'https://youtube.com/@nicheuniversityonline?si=JMZ_WMGvKk8_Td0k' },
    ],
  },
];

export default function AboutLinksScreen() {
  const openLink = async (link) => {
    if (link.page) {
      router.push({ pathname: '/about-info', params: { page: link.page } });
      return;
    }

    try {
      await Linking.openURL(link.url);
    } catch (error) {
      Alert.alert('Unable to open link', error.message || 'Please try again.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 21, marginBottom: 17, overflow: 'hidden' }}>
          <Text style={{ color: '#BBD4FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>NICHE TRADE · CAMPUS COMMUNITY</Text>
          <Text style={{ color: colors.white, fontSize: 25, fontWeight: '900', marginTop: 10 }}>Good to have you here.</Text>
          <Text style={{ color: '#D4E2F4', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
            Explore the marketplace, learn about NicheTrade, and stay connected with our community.
          </Text>
        </View>

        {footerLinks.map((section) => (
          <View key={section.title} style={{ backgroundColor: colors.white, borderRadius: 18, padding: 16, marginBottom: 12, ...shadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: colors.blue, fontSize: 17, fontWeight: '800' }}>{section.icon}</Text>
              </View>
              <View>
                <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>{section.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                  {section.title === 'About Us' ? 'Learn more about us' : 'Follow our community'}
                </Text>
              </View>
            </View>
            {section.links.map((link) => (
              <Pressable key={link.text} onPress={() => openLink(link)} style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 4,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.65 : 1,
              })}>
                <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>{link.text}</Text>
                <Text style={{ color: colors.blue, fontSize: 19 }}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: 5 }}>
          NicheTrade · Buy · Sell · Connect
        </Text>
      </ScrollView>
    </Screen>
  );
}
