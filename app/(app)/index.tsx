import HomeScreen from '@/screens/home/HomeScreen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export default function Home() {
  useEffect(() => {
    console.log('Home screen (app/index.tsx) mounted');
  }, []);

  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 