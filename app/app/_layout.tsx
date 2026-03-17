import { Stack } from 'expo-router';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar hidden={true} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="SignupScreen" />
          <Stack.Screen name="OTPRequestScreen" />
          <Stack.Screen name="OTPPasswordResetScreen" />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        </Stack>
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}