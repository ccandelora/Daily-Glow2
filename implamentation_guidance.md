CODE TRANSFORMATION EXAMPLES:

// PROBLEM: Old navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// SOLUTION: Expo Router approach
// app/index.js
export default function Home() {
  return <Link href="/details">Go to details</Link>;
}

// app/details.js
export default function Details() {
  return <View><Text>Details screen</Text></View>;
}

// PROBLEM: Manual font loading
useEffect(() => {
  async function loadFonts() {
    await Font.loadAsync({
      'montserrat': require('./assets/fonts/Montserrat.ttf'),
    });
    setFontsLoaded(true);
  }
  loadFonts();
}, []);

// SOLUTION: Modern approach with expo-font
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'montserrat': require('./assets/fonts/Montserrat.ttf'),
  });
  
  if (!fontsLoaded) return <AppLoading />;
  
  return <MainComponent />;
}