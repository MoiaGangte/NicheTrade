import { useState } from 'react';
import { Alert, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { useApp } from '../context/AppContext';
import { Button, Field, Screen } from '../components/UI';
import { colors } from '../theme';

const loadWebCheckout = () => new Promise((resolve, reject) => {
  if (globalThis.window?.Razorpay) {
    resolve();
    return;
  }
  const existingScript = document.querySelector('script[data-nichetrade-razorpay]');
  const script = existingScript || document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.dataset.nichetradeRazorpay = 'true';
  script.onload = resolve;
  script.onerror = () => reject(new Error('Unable to load the donation payment form'));
  if (!existingScript) document.head.appendChild(script);
});

export default function DonateScreen() {
  const { api, user } = useApp();
  const [amount, setAmount] = useState('50');
  const [busy, setBusy] = useState(false);

  const donate = async () => {
    const donationAmount = Number(amount);
    if (!Number.isSafeInteger(donationAmount) || donationAmount < 1 || donationAmount > 100000) {
      Alert.alert('Invalid amount', 'Enter a whole-rupee donation between ₹1 and ₹100,000.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post('/api/donation/create-order', { amount: donationAmount });
      if (!data.success) throw new Error(data.message || 'Unable to start donation');

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: 'NicheTrade',
        description: 'Voluntary community donation',
        prefill: { name: user?.name, email: user?.email },
        theme: { color: colors.blue },
      };
      let payment;
      if (Platform.OS === 'web') {
        await loadWebCheckout();
        payment = await new Promise((resolve, reject) => {
          const checkout = new globalThis.window.Razorpay({
            ...options,
            handler: resolve,
            modal: { ondismiss: () => reject(new Error('Donation cancelled')) },
          });
          checkout.on('payment.failed', (response) => reject(
            new Error(response.error?.description || 'Donation payment failed'),
          ));
          checkout.open();
        });
      } else {
        payment = await RazorpayCheckout.open(options);
      }

      const verification = await api.post('/api/donation/verify', payment);
      if (!verification.data.success) throw new Error(verification.data.message || 'Unable to verify donation');
      Alert.alert('Thank you!', 'Your donation was received. Thank you for supporting NicheTrade.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Donation could not be completed';
      if (message !== 'Donation cancelled') Alert.alert('Donation', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 24 }}>
        <Text onPress={() => router.back()} style={{ color: colors.blue, marginBottom: 18 }}>‹ Back</Text>
        <Text style={{ color: colors.navy, fontSize: 26, fontWeight: '800' }}>Support NicheTrade</Text>
        <Text style={{ color: colors.navy, lineHeight: 21, marginTop: 9, marginBottom: 2 }}>
          NicheTrade is a community-driven platform. Donations help us maintain and improve the app, and keep it free for everyone.
        </Text>
        <Text style={{ color: colors.navy, lineHeight: 21, marginTop: 1, marginBottom: 20 }}>
          Donations are completely optional and are not connected to buying items or publishing listings.
        </Text>
        <Field label="Donation amount (₹)" value={amount} onChangeText={setAmount} placeholder="Enter whole rupees" keyboardType="number-pad" />
        <Button title={busy ? 'Opening secure checkout…' : 'Donate'} disabled={busy} onPress={donate} />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 15 }}>
          Donations are processed by Razorpay. Please contact support before retrying if payment completed but confirmation failed.
        </Text>
      </ScrollView>
    </Screen>
  );
}
