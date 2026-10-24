import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';

export function Screen({ children, style, ...props }) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={[{ flex: 1, backgroundColor: colors.canvas }, style]} {...props}>{children}</SafeAreaView>;
}

export function PageTitle({ title, subtitle, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 25, fontWeight: '800', color: colors.navy }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.muted, marginTop: 4 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({ title, onPress, secondary, disabled, style, icon }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{
        minHeight: 48, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 16, borderRadius: 14,
        backgroundColor: secondary ? colors.white : colors.blue,
        borderWidth: secondary ? 1 : 0, borderColor: colors.border,
        opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
      }, style]}
    >
      {disabled ? <ActivityIndicator color={secondary ? colors.blue : colors.white} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          {icon ? <Image source={icon} style={{ width: 20, height: 20 }} resizeMode="contain" /> : null}
          <Text style={{ color: secondary ? colors.navy : colors.white, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function CartIcon() {
  const stroke = { position: 'absolute', height: 1.7, borderRadius: 1, backgroundColor: '#364153' };
  return (
    <View accessibilityElementsHidden style={{ width: 22, height: 21 }}>
      <View style={[stroke, { width: 6, left: 0, top: 2, transform: [{ rotate: '18deg' }] }]} />
      <View style={[stroke, { width: 12, left: 4, top: 8, transform: [{ rotate: '79deg' }] }]} />
      <View style={[stroke, { width: 14, left: 7, top: 6 }]} />
      <View style={[stroke, { width: 9, left: 12, top: 11, transform: [{ rotate: '104deg' }] }]} />
      <View style={[stroke, { width: 10, left: 8, top: 15 }]} />
      <View style={{ position: 'absolute', left: 7, top: 18, width: 4, height: 4, borderWidth: 1.5, borderColor: '#364153', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 16, top: 18, width: 4, height: 4, borderWidth: 1.5, borderColor: '#364153', borderRadius: 2 }} />
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, secureTextEntry, autoCapitalize }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ color: colors.ink, fontWeight: '700', marginBottom: 7 }}>{label}</Text> : null}
      <View style={{
        minHeight: multiline ? 104 : 48, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#93A0B1"
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !passwordVisible}
          autoCapitalize={autoCapitalize || 'sentences'}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{
            flex: 1, minHeight: multiline ? 104 : 48, color: colors.ink,
            paddingHorizontal: 14, paddingVertical: 12,
          }}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: passwordVisible }}
            onPress={() => setPasswordVisible((visible) => !visible)}
            hitSlop={8}
            style={{ paddingHorizontal: 14, paddingVertical: 12 }}
          >
            <Text style={{ color: colors.blue, fontSize: 13, fontWeight: '700' }}>
              {passwordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ProductCard({ product, onPress, onFavorite, favorite, onAdd }) {
  const image = Array.isArray(product.image) ? product.image[0] : product.image;
  const seller = product.sellerId;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        flex: 1, margin: 5, padding: 9, backgroundColor: colors.white,
        borderRadius: 17, borderWidth: 1, borderColor: colors.border,
        opacity: pressed ? 0.9 : 1, ...shadow,
      }]}
    >
      <View style={{ height: 132, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.paleBlue }}>
        {image ? <Image source={{ uri: image }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : null}
        {onFavorite ? (
          <Pressable
            onPress={(event) => { event.stopPropagation(); onFavorite(); }}
            hitSlop={8}
            style={{ position: 'absolute', top: 7, right: 7, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: favorite ? colors.red : colors.navy, fontSize: 17 }}>{favorite ? '♥' : '♡'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ marginTop: 9, color: colors.muted, fontSize: 11 }}>
        {(product.categories?.length ? product.categories : [product.category]).filter(Boolean).join(' · ')}
      </Text>
      <Text numberOfLines={1} style={{ marginTop: 3, color: colors.navy, fontWeight: '700', fontSize: 14 }}>{product.name}</Text>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>
        {seller?.name || 'NicheTrade Seller'}{seller?.department ? ` · ${seller.department}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
        <View>
          <Text style={{ color: colors.blue, fontWeight: '800', fontSize: 15 }}>₹{product.offerPrice}</Text>
          {product.price > product.offerPrice ? <Text style={{ color: colors.muted, fontSize: 11, textDecorationLine: 'line-through' }}>₹{product.price}</Text> : null}
        </View>
        {onAdd ? (
          <Pressable onPress={(event) => { event.stopPropagation(); onAdd(); }} style={{ backgroundColor: colors.blue, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7 }}>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>Add</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({ title, detail }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20 }}>
      <Text style={{ color: colors.navy, fontSize: 17, fontWeight: '700' }}>{title}</Text>
      {detail ? <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 7, lineHeight: 20 }}>{detail}</Text> : null}
    </View>
  );
}
