import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import api, { API_URL, getErrorMessage, removeStoredToken, setStoredToken, TOKEN_KEY } from '../api';

if (Platform.OS !== 'web') WebBrowser.maybeCompleteAuthSession();

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(true);
  const [cartReady, setCartReady] = useState(false);

  const refreshProducts = useCallback(async () => {
    const { data } = await api.get('/api/product/list');
    if (!data.success) throw new Error(data.message || 'Unable to load marketplace listings');
    setProducts(data.products || []);
  }, []);

  const refreshMarketplace = useCallback(async () => {
    const results = await Promise.allSettled([
      refreshProducts(),
      api.get('/api/product/categories'),
    ]);
    if (results[1].status === 'fulfilled' && results[1].value.data.success) {
      setCategories(results[1].value.data.categories || []);
    }
    if (results[0].status === 'rejected') {
      Alert.alert('Marketplace unavailable', getErrorMessage(results[0].reason));
    }
  }, [refreshProducts]);

  const loadAccount = useCallback(async () => {
    try {
      const { data } = await api.get('/api/user/is-auth');
      if (!data.success || !data.user) {
        await removeStoredToken(TOKEN_KEY);
        setUser(null);
        setSeller(null);
        setCartItems({});
        setFavorites({});
        return;
      }
      setUser(data.user);
      setCartItems(data.user.cartItems || {});
      setFavorites(data.user.favorites || {});
      if (data.user.role === 'seller') {
        try {
          const sellerResponse = await api.get('/api/seller/is-auth');
          setSeller(sellerResponse.data.seller || null);
        } catch (error) {
          if (error.response?.status !== 404) console.warn('Seller profile refresh failed:', getErrorMessage(error));
          setSeller(null);
        }
      } else {
        setSeller(null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await removeStoredToken(TOKEN_KEY);
        setUser(null);
        setSeller(null);
        setCartItems({});
        setFavorites({});
      } else {
        console.warn('Account refresh failed:', getErrorMessage(error));
      }
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.allSettled([refreshMarketplace(), loadAccount()]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadAccount, refreshMarketplace]);

  useEffect(() => {
    if (!user || !cartReady) return;
    api.post('/api/cart/update', { cartItems }).catch((error) => {
      console.warn('Cart sync failed:', getErrorMessage(error));
    });
  }, [cartItems, cartReady, user]);

  const acceptToken = useCallback(async (token, account) => {
    if (!token) throw new Error('Authentication did not return a session token');
    await setStoredToken(TOKEN_KEY, token);
    if (account) {
      setUser(account);
      setCartItems(account.cartItems || {});
      setFavorites(account.favorites || {});
      setCartReady(true);
      if (account.role === 'seller') {
        const { data } = await api.get('/api/seller/is-auth');
        setSeller(data.seller || null);
      } else {
        setSeller(null);
      }
    } else {
      await loadAccount();
    }
  }, [loadAccount]);

  const signIn = useCallback(async (payload, endpoint = '/api/user/login') => {
    const { data } = await api.post(endpoint, payload);
    if (!data.success) throw new Error(data.message || 'Unable to sign in');
    await acceptToken(data.token, data.user);
    return data.user;
  }, [acceptToken]);

  const completeGoogleSignIn = useCallback(async (code) => {
    const { data } = await api.post('/api/user/mobile-auth/exchange', { code });
    if (!data.success || !data.token) throw new Error(data.message || 'Unable to complete Google sign-in');
    await acceptToken(data.token, data.user);
  }, [acceptToken]);

  const googleSignIn = useCallback(async (studentDetails) => {
    let registrationPayload = '';
    if (studentDetails) {
      const { data } = await api.post('/api/user/mobile-auth/start', studentDetails);
      if (!data.success || !data.mobileRegistration) throw new Error(data.message || 'Unable to start Google sign-in');
      registrationPayload = `&mobileRegistration=${encodeURIComponent(data.mobileRegistration)}`;
    }
    const state = Crypto.randomUUID();
    if (Platform.OS === 'web') {
      const returnUrl = `${window.location.origin}/auth`;
      window.sessionStorage.setItem('nichetrade.google-auth-state', state);
      const authUrl = `${API_URL}/api/user/google?mobileRedirect=${encodeURIComponent(returnUrl)}&mobileState=${encodeURIComponent(state)}${registrationPayload}`;
      window.location.assign(authUrl);
      return false;
    }

    const returnUrl = AuthSession.makeRedirectUri({ scheme: 'nichetrade', path: 'auth' });
    const authUrl = `${API_URL}/api/user/google?mobileRedirect=${encodeURIComponent('nichetrade://auth')}&mobileState=${encodeURIComponent(state)}${registrationPayload}`;
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      if (result.type !== 'success' || !result.url) return false;
      const callback = Linking.parse(result.url);
      const code = callback.queryParams?.code;
      const callbackState = callback.queryParams?.state;
      if (typeof callbackState !== 'string' || callbackState !== state) {
        throw new Error('Google sign-in could not verify the authentication session');
      }
      if (typeof code !== 'string') throw new Error('Google sign-in did not return a valid mobile code');
      await completeGoogleSignIn(code);
      return true;
    } catch (error) {
      if (error.response) throw new Error(getErrorMessage(error));
      throw error;
    }
  }, [completeGoogleSignIn]);

  const signOut = useCallback(async () => {
    let tokenRemovalError;
    try {
      await removeStoredToken(TOKEN_KEY);
    } catch (error) {
      tokenRemovalError = error;
    }
    setUser(null);
    setSeller(null);
    setCartItems({});
    setFavorites({});

    api.post('/api/user/logout').catch((error) => {
      console.warn('Remote sign-out cleanup failed:', getErrorMessage(error));
    });

    if (tokenRemovalError) throw tokenRemovalError;
  }, []);

  const addToCart = useCallback((productId) => {
    if (!user) {
      Alert.alert('Sign in to continue', 'Create an account or sign in to save your cart.');
      return false;
    }
    setCartItems((current) => ({ ...current, [productId]: (current[productId] || 0) + 1 }));
    return true;
  }, [user]);

  const updateCartQuantity = useCallback((productId, quantity) => {
    setCartItems((current) => {
      const next = { ...current };
      if (quantity < 1) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (productId) => {
    if (!user) {
      Alert.alert('Sign in to save favorites', 'Your saved listings are linked to your account.');
      return;
    }
    const next = { ...favorites, [productId]: !favorites[productId] };
    setFavorites(next);
    try {
      const { data } = await api.post('/api/user/favorites/update', { favorites: next });
      if (!data.success) throw new Error(data.message || 'Unable to save favorites');
    } catch (error) {
      setFavorites(favorites);
      Alert.alert('Could not save favorite', getErrorMessage(error));
    }
  }, [favorites, user]);

  const value = useMemo(() => ({
    api, user, setUser, seller, setSeller, products, categories, cartItems, favorites,
    loading, currency: process.env.EXPO_PUBLIC_CURRENCY || '₹',
    refreshProducts, refreshMarketplace, loadAccount, signIn, googleSignIn, completeGoogleSignIn, signOut,
    addToCart, updateCartQuantity, toggleFavorite,
  }), [
    user, seller, products, categories, cartItems, favorites, loading,
    refreshProducts, refreshMarketplace, loadAccount, signIn, googleSignIn, completeGoogleSignIn, signOut,
    addToCart, updateCartQuantity, toggleFavorite,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
