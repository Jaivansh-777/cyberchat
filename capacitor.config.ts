import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jaivansh.cyberchat',
  appName: 'CyberChat',
  webDir: '.next',
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
