import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../components/UI';
import { colors, shadow } from '../theme';

const pages = {
  'developer-team': {
    title: 'Meet Our Developers',
    intro: 'Great ideas are built by great people. Meet the team combining creativity, technology, and teamwork to bring NicheTrade to life.',
    sections: [
      {
        title: 'Moia Gangte · Developer',
        body: 'A student of Noorul Islam Centre for Higher Education, pursuing B.E. in Artificial Intelligence and Data Science. Passionate about web development and building interactive, user-friendly applications.',
        points: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'HTML', 'CSS'],
      },
      {
        title: 'Our approach',
        body: 'From front-end experiences to back-end services, the project brings together design and technology to make campus life more connected.',
      },
    ],
    closing: 'Built with creativity, collaboration, and code.',
  },
  regulation: {
    title: 'Rules and Regulations',
    intro: 'Building a safe, fair, and trustworthy student marketplace. These guidelines help ensure a positive experience for the NICHE campus community.',
    sections: [
      {
        title: '01 · Seller Rules and Responsibilities',
        body: 'Sellers must provide accurate product information, genuine images, correct prices, and updated availability details.',
        points: [
          'Selling stolen, counterfeit, illegal, or prohibited items is forbidden.',
          'Communicate respectfully with buyers and keep descriptions and prices accurate.',
          'Fraud or misleading advertisements may result in account restrictions.',
        ],
      },
      {
        title: '02 · Buyer Rules and Responsibilities',
        body: 'Review product details and communicate with sellers before completing a transaction.',
        points: [
          'Verify condition, price, and availability.',
          'Agree on payment and delivery arrangements directly with the seller.',
          'Do not engage in fraud, harassment, threats, or misleading communication.',
          'Report suspicious sellers, scams, or inappropriate listings.',
        ],
      },
      {
        title: '03 · Product Listing Regulations',
        body: 'Every listing must be genuine, relevant, and appropriate for the NICHE campus community.',
        points: [
          'Images and information must accurately represent the item.',
          'Spam, duplicate listings, offensive content, and misleading advertisements are prohibited.',
          'Illegal or prohibited products are not allowed.',
          'Administrators may review or remove listings that violate these rules.',
        ],
      },
      {
        title: '04 · Lost-and-Found Regulations',
        body: 'Lost-and-found posts should help reunite students with their belongings.',
        points: [
          'Share truthful, relevant information and do not falsely claim found property.',
          'Avoid publishing sensitive personal information.',
          'False, misleading, duplicate, outdated, or inappropriate posts may be removed.',
        ],
      },
      {
        title: '05 · Item Request Regulations',
        body: 'Item requests help students find products within the campus community.',
        points: [
          'Requests must be genuine, clear, and relevant to campus.',
          'Fake requests, spam, harassment, and requests for prohibited items are not allowed.',
          'Requests that violate the rules may be disabled or removed.',
        ],
      },
      {
        title: '06 · Administrator Rights and Enforcement',
        body: 'Authorized administrators maintain a safe, fair, and trustworthy marketplace.',
        points: [
          'Administrators may investigate reports and issue warnings or request corrections.',
          'They may remove posts, restrict accounts, or suspend users for violations.',
          'Actions should be applied responsibly and consistently; users should be informed and given an opportunity to appeal where appropriate.',
        ],
      },
      {
        title: '07 · Safe Transactions and User Responsibility',
        body: 'Users are responsible for making informed decisions and communicating clearly.',
        points: [
          'Confirm condition, availability, and price before exchanging money.',
          'Choose a safe, convenient campus location for collection or delivery.',
          'Be cautious when sharing personal information or transferring money.',
          'NicheTrade does not guarantee the quality, authenticity, or availability of listed items.',
        ],
      },
    ],
    closing: 'Treat other students respectfully, provide honest information, and report suspicious activity to help build a better campus community.',
  },
  objective: {
    title: 'Why NicheTrade Exists',
    intro: 'NicheTrade is a student-focused marketplace for the Noorul Islam Centre for Higher Education community. It brings buying, selling, lost-and-found notices, and item requests together in one place.',
    sections: [
      {
        title: '01 · Buy and sell on campus',
        body: 'Give students a convenient place to list useful items, discover affordable finds, and connect with other members of the college community.',
      },
      {
        title: '02 · Help lost items find their way home',
        body: 'Make it easier to share lost-and-found notices so misplaced belongings can be reunited with the students who own them.',
      },
      {
        title: '03 · Create earning opportunities',
        body: 'Help students earn extra money by selling items they no longer need or offering services to other students.',
      },
    ],
    closing: 'Our goal is to make campus life more connected, resourceful, and supportive for every student.',
  },
  documentation: {
    title: 'NicheTrade Documentation',
    intro: 'A practical guide to using the student marketplace at Noorul Islam Centre for Higher Education.',
    sections: [
      {
        title: '01 · Getting started',
        body: 'Create an account or sign in, then choose whether to browse products, sell items, or take part in campus Lost & Found and item requests.',
      },
      {
        title: '02 · Shop and place an order',
        body: 'Browse or search the product catalog, review an item’s details, and add available products to your cart. At checkout, choose campus delivery details and submit your order. Review order status in Orders.',
      },
      {
        title: '03 · Sell on NicheTrade',
        body: 'Sign in and register as a seller. Create a listing with its name, description, category, price, stock, and image. Listings are free. Arrange sale payment directly with the buyer; donations are optional and separate.',
      },
      {
        title: '04 · Community features',
        body: 'Use Lost & Found to share information about missing or found belongings. Post an item request when you need something brought to campus; other students can respond to requests.',
      },
      {
        title: '05 · Your account',
        body: 'Use Profile to review your account and update student details. Keep contact information current and share only what is needed to arrange a campus exchange.',
      },
      {
        title: '06 · Safe exchanges',
        body: 'Confirm an item’s condition, availability, price, and collection or delivery arrangements directly with the other student. Exercise caution when sharing personal information or transferring money.',
      },
    ],
    closing: 'NicheTrade is a campus marketplace project created to make student buying, selling, and helping one another easier.',
  },
};

export default function AboutInfoScreen() {
  const { page } = useLocalSearchParams();
  const content = pages[page] || pages.objective;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 21, marginBottom: 16 }}>
          <Text style={{ color: '#BBD4FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>NICHE TRADE · CAMPUS COMMUNITY</Text>
          <Text style={{ color: colors.white, fontSize: 25, fontWeight: '900', marginTop: 10 }}>{content.title}</Text>
          <Text style={{ color: '#D4E2F4', fontSize: 14, lineHeight: 21, marginTop: 8 }}>{content.intro}</Text>
        </View>

        {content.sections.map((section) => (
          <View key={section.title} style={{ backgroundColor: colors.white, borderRadius: 18, padding: 16, marginBottom: 12, ...shadow }}>
            <Text style={{ color: colors.navy, fontSize: 16, fontWeight: '800' }}>{section.title}</Text>
            <Text style={{ color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{section.body}</Text>
            {section.points?.map((point) => (
              <View key={point} style={{ flexDirection: 'row', marginTop: 9 }}>
                <Text style={{ color: colors.blue, fontWeight: '800', marginRight: 8 }}>•</Text>
                <Text style={{ flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 }}>{point}</Text>
              </View>
            ))}
          </View>
        ))}

        {content.closing ? (
          <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 19, marginTop: 3 }}>{content.closing}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
