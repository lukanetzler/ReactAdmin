import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.prayvail.app',
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
      // Transparent overlay so the app content flows edge-to-edge
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
