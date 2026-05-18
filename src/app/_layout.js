import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <Slot />
    </View>
  );
}