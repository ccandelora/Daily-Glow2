import 'react-native-get-random-values';
import * as Crypto from 'expo-crypto';

// Based on the Supabase React Native quickstart guide
// This polyfill is needed for the PKCE auth flow

console.log('Setting up crypto polyfill...');

// @ts-ignore - Ignore all type checking in this file
if (typeof global.crypto !== 'object') {
  // @ts-ignore
  global.crypto = {};
}

// @ts-ignore
if (typeof global.crypto.getRandomValues !== 'function') {
  console.log('Polyfilling crypto.getRandomValues');
  // @ts-ignore
  global.crypto.getRandomValues = Crypto.getRandomValues;
}

// Log success
console.log('Crypto polyfill setup complete');

export default {}; 