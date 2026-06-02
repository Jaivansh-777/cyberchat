import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jaivansh.cyberchat',
  appName: 'CyberChat',
  webDir: '.next',
  server: {
    url: 'https://cyberchat-j38i.onrender.com',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
