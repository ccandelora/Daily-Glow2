import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(null),
}));

jest.mock('expo-linear-gradient', () => 'LinearGradient');

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'mock-key',
      },
    },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({
    id: 'test-id',
  })),
  useSegments: jest.fn(() => ['test-segment']),
  useRootNavigationState: jest.fn(() => ({
    key: 'root',
    index: 0,
    routeNames: ['home'],
    history: [{ type: 'route', key: 'home' }],
    stale: false,
    type: 'stack',
    routes: [{ key: 'home', name: 'home' }],
  })),
  Link: jest.fn().mockImplementation(() => 'Link'),
  Stack: {
    Screen: jest.fn().mockImplementation(() => 'Stack.Screen'),
  },
  Redirect: jest.fn().mockImplementation(() => 'Redirect'),
  Tabs: {
    Screen: jest.fn().mockImplementation(() => 'Tabs.Screen'),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChange: jest.fn(() => ({ 
          data: { subscription: { unsubscribe: jest.fn() } } 
        })),
        getSession: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  };
});

// Mock the async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// Use a simpler mock for NativeAnimatedHelper
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  
  rn.NativeModules.NativeAnimatedHelper = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    getValue: jest.fn(),
  };
  
  rn.TextInput.prototype.focus = jest.fn();
  rn.TextInput.prototype.blur = jest.fn();
  
  return rn;
});

// Set timezone to UTC for consistent date handling
process.env.TZ = 'UTC'; 