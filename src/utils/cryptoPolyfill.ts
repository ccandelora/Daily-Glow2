import 'react-native-get-random-values';
import * as Crypto from 'expo-crypto';

// Based on the Supabase React Native quickstart guide
// This polyfill is needed for the PKCE auth flow

// @ts-ignore
if (typeof global.crypto !== 'object') {
  // @ts-ignore
  global.crypto = {};
}

// @ts-ignore
if (typeof global.crypto.getRandomValues !== 'function') {
  // @ts-ignore
  global.crypto.getRandomValues = Crypto.getRandomValues;
}

export default {}; 