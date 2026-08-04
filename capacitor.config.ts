import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prayvail.app',
  appName: 'Prayvail',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
  android: {
    // Draw content behind the status bar and navigation bar
    edgeToEdge: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
