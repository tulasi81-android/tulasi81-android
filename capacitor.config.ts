import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edas.app',
  appName: 'EDASapp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
