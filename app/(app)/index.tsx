import HomeScreen from '@/screens/home/HomeScreen';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    console.log('Home screen (app/index.tsx) mounted');
  }, []);

  return <HomeScreen />;
} 