import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.photoeditor.app',
  appName: 'PhotoEditor',
  webDir: 'dist/blank',
  server: {
    androidScheme: 'https'
  }
};

export default config;
