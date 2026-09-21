import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import '../global.css';

const RNStyleSheet = StyleSheet as typeof StyleSheet & {
  setFlag?: (name: string, value: string) => void;
};

RNStyleSheet.setFlag?.('darkMode', 'class');

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="main" />
      <Stack.Screen name="create-case" />
      <Stack.Screen name="join-case" />
      <Stack.Screen name="qr-scanner" />
      <Stack.Screen name="case-preview" />
      <Stack.Screen name="join-confirmation" />
      <Stack.Screen name="search-session" />
      <Stack.Screen name="active-search" />
      <Stack.Screen name="ai-priority" />
      <Stack.Screen name="possible-match" />
      <Stack.Screen name="session-entry" />
      <Stack.Screen name="case-details" />
      <Stack.Screen name="case-timeline" />
      <Stack.Screen name="cases" />
      <Stack.Screen name="search" />
      <Stack.Screen name="volunteer" />
      <Stack.Screen name="public" />
      <Stack.Screen name="public-case-details" />
      <Stack.Screen name="public-search-alert" />
      <Stack.Screen name="manager" />
      <Stack.Screen name="reporter" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
