import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function AppInfoScreen() {
  const router = useRouter();
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  
  useEffect(() => {
    loadStorageKeys();
  }, []);
  
  const loadStorageKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setStorageKeys(keys);
    } catch (error) {
      console.error('Error loading storage keys:', error);
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  const getAppInfo = () => {
    const info = [
      { label: 'App Name', value: Constants.expoConfig?.name || 'Unknown' },
      { label: 'App Version', value: Constants.expoConfig?.version || 'Unknown' },
      { label: 'Build Version', value: Application.nativeBuildVersion || 'Unknown' },
      { label: 'Bundle ID', value: Application.applicationId || 'Unknown' },
      { label: 'Expo SDK Version', value: Constants.expoConfig?.sdkVersion || 'Unknown' },
      { label: 'App Scheme', value: Constants.expoConfig?.scheme || 'Unknown' },
    ];
    return info;
  };
  
  const getDeviceInfo = () => {
    const info = [
      { label: 'Device Brand', value: Device.brand || 'Unknown' },
      { label: 'Device Model', value: Device.modelName || 'Unknown' },
      { label: 'Device Type', value: Device.deviceType ? Device.getDeviceTypeAsync().then(type => Device.DeviceType[type]) : 'Unknown' },
      { label: 'OS', value: `${Platform.OS} ${Platform.Version}` },
      { label: 'Memory', value: Device.totalMemory ? `${Math.round(Device.totalMemory / (1024 * 1024))} MB` : 'Unknown' },
    ];
    return info;
  };
  
  const getDeepLinkInfo = () => {
    const info = [
      { label: 'URL', value: Linking.createURL('') },
      { label: 'Auth Callback URL', value: Linking.createURL('auth/callback') },
    ];
    return info;
  };
  
  const getSupabaseInfo = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not configured';
    // Don't show the full anon key for security reasons
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` 
      : 'Not configured';
      
    const info = [
      { label: 'Supabase URL', value: url },
      { label: 'Anon Key', value: anonKey },
      { label: 'Auth URL', value: `${url}/auth/v1` },
    ];
    return info;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Information</Text>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Details</Text>
          {getAppInfo().map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}:</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          {getDeviceInfo().map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}:</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deep Linking</Text>
          {getDeepLinkInfo().map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}:</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase Configuration</Text>
          {getSupabaseInfo().map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}:</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AsyncStorage Keys ({storageKeys.length})</Text>
          {storageKeys.map((key, index) => (
            <Text key={index} style={styles.storageKey}>{key}</Text>
          ))}
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1c0e2d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: '#aaa',
    width: '40%',
  },
  infoValue: {
    color: '#fff',
    flex: 1,
    fontFamily: 'monospace',
  },
  storageKey: {
    color: '#ddd',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  backButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 