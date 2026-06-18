import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unnoted.smartnotebook',
  appName: 'UnNoted',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // In development, point to your Replit dev URL for hot-reload
    // For production builds this is unused (assets are bundled locally)
    // url: 'https://your-replit-url.replit.dev',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true
  }
};

export default config;
