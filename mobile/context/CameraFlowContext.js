import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Dimensions, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from './AppContext';
import { colors, shadow } from '../theme';

const CameraFlowContext = createContext(null);
const MAX_PHOTOS = 3;

export function CameraFlowProvider({ children }) {
  const { api, user, seller, setSeller } = useApp();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [lostFoundChoiceVisible, setLostFoundChoiceVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [handoff, setHandoff] = useState(null);
  const [lostFoundType, setLostFoundType] = useState('lost');
  const [sellerCheckLoading, setSellerCheckLoading] = useState(false);
  const [sellerCheckError, setSellerCheckError] = useState('');
  const [sellerPrompt, setSellerPrompt] = useState('');
  const pendingCamera = useRef(null);

  const clearFlow = useCallback(() => {
    setMenuVisible(false);
    setLostFoundChoiceVisible(false);
    setPermissionDenied(false);
    setReviewVisible(false);
    setPhotos([]);
    setHandoff(null);
    pendingCamera.current = null;
  }, []);

  const recoverPendingCamera = useCallback(async () => {
    if (Platform.OS === 'web' || typeof ImagePicker.getPendingResultAsync !== 'function') return;
    try {
      const result = await ImagePicker.getPendingResultAsync();
      if (result && !result.canceled && result.assets?.length) {
        setPhotos((current) => [...current, ...result.assets].slice(0, MAX_PHOTOS));
        setReviewVisible(true);
      }
    } catch (error) {
      const message = error?.message || String(error || '');
      if (!message.includes("reading 'assets'") && !message.includes('Cannot read properties of null')) {
        console.warn('Unable to recover camera photo:', message);
      }
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') recoverPendingCamera();
    });
    return () => subscription.remove();
  }, [recoverPendingCamera]);

  const openCamera = useCallback(async () => {
    setPermissionDenied(false);
    const current = await ImagePicker.getCameraPermissionsAsync();
    const permission = current.granted
      ? current
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setReviewVisible(false);
      setPermissionDenied(true);
      return false;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled) {
      if (!photos.length) clearFlow();
      else setReviewVisible(true);
      return false;
    }
    if (result.assets?.length) {
      setPhotos((current) => [...current, ...result.assets].slice(0, MAX_PHOTOS));
      setReviewVisible(true);
      return true;
    }
    return false;
  }, [clearFlow, photos.length]);

  const continueToUpload = useCallback(() => {
    const target = pendingCamera.current;
    if (!target) return;
    setHandoff({ target, photos: [...photos], lostFoundType });
    setMenuVisible(false);
    setLostFoundChoiceVisible(false);
    setReviewVisible(false);
    router.push(
      target === 'sell' ? '/(tabs)/sell'
        : target === 'lost-found' ? '/(tabs)/lost-found'
          : '/(tabs)/requests',
    );
  }, [lostFoundType, photos]);

  const consumeHandoff = useCallback((target) => {
    if (handoff?.target !== target) return null;
    const result = handoff;
    if (result.lostFoundType) setLostFoundType(result.lostFoundType);
    setHandoff(null);
    setPhotos([]);
    pendingCamera.current = null;
    return result.photos;
  }, [handoff]);

  const chooseTarget = useCallback((target) => {
    pendingCamera.current = target;
    setMenuVisible(false);
    setPhotos([]);
    if (target === 'lost-found') {
      setLostFoundChoiceVisible(true);
      return;
    }
    openCamera();
  }, [openCamera]);

  const checkSeller = useCallback(async () => {
    setSellerCheckLoading(true);
    setSellerCheckError('');
    setSellerPrompt('');
    try {
      if (user?.role === 'admin') {
        pendingCamera.current = 'sell';
        await openCamera();
        return;
      }
      const { data } = await api.get('/api/seller/is-auth');
      const accountStatus = data.seller?.status || 'active';
      if (accountStatus === 'suspended') {
        setSellerPrompt('Your seller account is suspended');
        return;
      }
      if (accountStatus === 'banned' || data.seller?.isActive === false || data.seller?.isApproved === false) {
        setSellerPrompt('Your seller account is not available for selling');
        return;
      }
      pendingCamera.current = 'sell';
      await openCamera();
    } catch (error) {
      const status = error.response?.data?.sellerStatus;
      if (status === 'suspended') {
        setSellerPrompt('Your seller account is suspended');
      } else if (status === 'banned') {
        setSellerPrompt('Your seller account is not available for selling');
      } else if (error.response?.status === 404) {
        setSellerPrompt('Register as a seller to sell items');
      } else {
        setSellerCheckError(error.response?.data?.message || error.message || 'Unable to check your seller account');
      }
    } finally {
      setSellerCheckLoading(false);
    }
  }, [api, openCamera, user]);

  const openCameraMenu = useCallback(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setSellerCheckError('');
    setSellerPrompt('');
    setMenuVisible(true);
  }, [user]);

  const registerSeller = useCallback(() => {
    setMenuVisible(false);
    setSellerPrompt('');
    pendingCamera.current = 'sell';
    router.push('/(tabs)/sell');
  }, []);

  const resumeAfterSellerRegistration = useCallback(async () => {
    try {
      const { data } = await api.get('/api/seller/is-auth');
      setSeller(data.seller || null);
      if (!photos.length) {
        pendingCamera.current = 'sell';
        await openCamera();
      } else {
        setReviewVisible(true);
      }
    } catch (error) {
      Alert.alert('Seller registration', error.response?.data?.message || error.message || 'Seller registration could not be verified.');
    }
  }, [api, openCamera, photos.length, setSeller]);

  useEffect(() => {
    if (!menuVisible && !lostFoundChoiceVisible && !reviewVisible && !permissionDenied) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (reviewVisible) setReviewVisible(false);
      else if (lostFoundChoiceVisible) setLostFoundChoiceVisible(false);
      else if (permissionDenied) setPermissionDenied(false);
      else if (menuVisible) setMenuVisible(false);
      else return false;
      return true;
    });
    return () => subscription.remove();
  }, [lostFoundChoiceVisible, menuVisible, permissionDenied, reviewVisible]);

  const value = useMemo(() => ({
    openCameraMenu,
    consumeHandoff,
    clearFlow,
    resumeAfterSellerRegistration,
    lostFoundType,
  }), [clearFlow, consumeHandoff, lostFoundType, openCameraMenu, resumeAfterSellerRegistration]);

  const width = Dimensions.get('window').width;

  return (
    <CameraFlowContext.Provider value={value}>
      {children}
      <Modal visible={menuVisible || lostFoundChoiceVisible || reviewVisible || permissionDenied} transparent animationType="slide" onRequestClose={clearFlow}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close camera menu" onPress={clearFlow} style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.38)' }} />
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 16), maxHeight: '88%' }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: colors.navy, fontSize: 20, fontWeight: '800' }}>{reviewVisible ? 'Review photos' : permissionDenied ? 'Camera access needed' : 'Create with camera'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close camera flow" onPress={clearFlow} hitSlop={8}><Text style={{ color: colors.muted, fontSize: 26 }}>×</Text></Pressable>
            </View>

            {permissionDenied ? (
              <View>
                <Text style={{ color: colors.muted, lineHeight: 21 }}>Allow camera access in Settings to take photos for a listing or community post.</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Open app settings" onPress={() => Linking.openSettings()} style={{ marginTop: 16, backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: colors.white, fontWeight: '800' }}>Open Settings</Text>
                </Pressable>
              </View>
            ) : reviewVisible ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {photos.map((photo, index) => (
                    <View key={`${photo.uri}-${index}`} style={{ width: width * 0.35, height: width * 0.35, maxWidth: 150, maxHeight: 150 }}>
                      <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} onPress={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} style={{ position: 'absolute', top: 5, right: 5, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(15,23,42,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.white, fontWeight: '800' }}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
                <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 10 }}>{photos.length}/{MAX_PHOTOS}</Text>
                {photos.length >= MAX_PHOTOS ? <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 3 }}>You can add up to 3 photos</Text> : null}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Add more photo" disabled={photos.length >= MAX_PHOTOS} onPress={openCamera} style={{ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1 }}>
                    <Text style={{ color: colors.navy, fontWeight: '800' }}>Add more photo</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Continue to upload page" disabled={!photos.length} onPress={continueToUpload} style={{ flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', opacity: photos.length ? 1 : 0.5 }}>
                    <Text style={{ color: colors.white, fontWeight: '800' }}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            ) : lostFoundChoiceVisible ? (
              <View style={{ gap: 10 }}>
                <Pressable accessibilityRole="button" accessibilityLabel="I lost something" onPress={() => { setLostFoundType('lost'); pendingCamera.current = 'lost-found'; setHandoff((current) => current ? { ...current, lostFoundType: 'lost' } : { target: 'lost-found', lostFoundType: 'lost', photos: [] }); setLostFoundChoiceVisible(false); openCamera(); }} style={{ padding: 16, borderRadius: 14, backgroundColor: colors.canvas }}>
                  <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16 }}>I lost something</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="I found something" onPress={() => { setLostFoundType('found'); pendingCamera.current = 'lost-found'; setHandoff((current) => current ? { ...current, lostFoundType: 'found' } : { target: 'lost-found', lostFoundType: 'found', photos: [] }); setLostFoundChoiceVisible(false); openCamera(); }} style={{ padding: 16, borderRadius: 14, backgroundColor: colors.canvas }}>
                  <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16 }}>I found something</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {sellerPrompt ? (
                  <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.canvas }}>
                    <Text style={{ color: colors.navy, fontWeight: '800', lineHeight: 21 }}>{sellerPrompt}</Text>
                    {sellerPrompt === 'Register as a seller to sell items' ? <Pressable accessibilityRole="button" accessibilityLabel="Register as a seller" onPress={registerSeller} style={{ marginTop: 12, backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}><Text style={{ color: colors.white, fontWeight: '800' }}>Register</Text></Pressable> : null}
                  </View>
                ) : sellerCheckError ? (
                  <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.canvas }}>
                    <Text style={{ color: colors.navy }}>{sellerCheckError}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Retry seller check" onPress={checkSeller} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}><Text style={{ color: colors.blue, fontWeight: '800' }}>Retry</Text></Pressable>
                  </View>
                ) : (
                  <>
                    <Pressable accessibilityRole="button" accessibilityLabel="Sell item" disabled={sellerCheckLoading} onPress={checkSeller} style={{ minHeight: 54, borderRadius: 14, backgroundColor: colors.canvas, justifyContent: 'center', paddingHorizontal: 16, opacity: sellerCheckLoading ? 0.65 : 1 }}>
                      <Text style={{ color: colors.navy, fontWeight: '800' }}>{sellerCheckLoading ? 'Checking seller account…' : 'Sell item'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Post Lost and Found item" onPress={() => chooseTarget('lost-found')} style={{ minHeight: 54, borderRadius: 14, backgroundColor: colors.canvas, justifyContent: 'center', paddingHorizontal: 16 }}>
                      <Text style={{ color: colors.navy, fontWeight: '800' }}>Post Lost & Found item</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Request item" onPress={() => chooseTarget('requests')} style={{ minHeight: 54, borderRadius: 14, backgroundColor: colors.canvas, justifyContent: 'center', paddingHorizontal: 16 }}>
                      <Text style={{ color: colors.navy, fontWeight: '800' }}>Request item</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </CameraFlowContext.Provider>
  );
}

export function useCameraFlow() {
  const value = useContext(CameraFlowContext);
  if (!value) throw new Error('useCameraFlow must be used inside CameraFlowProvider');
  return value;
}
