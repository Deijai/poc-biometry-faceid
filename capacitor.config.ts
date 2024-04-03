import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'poc-biometry-faceid',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
