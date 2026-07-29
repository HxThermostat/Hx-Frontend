import { Stack } from 'expo-router';
import { AppRegistry } from 'react-native';
import App from '../App';

// Register the app
const appName = 'jci-hx-app-two';
AppRegistry.registerComponent(appName, () => App);

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
} 