import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mutuelleawoundjo.client',
  appName: 'Awoundjô Client',
  webDir: 'dist',
  server: {
    url: 'https://www.mutuelleawoundjo.org/client/login',
    cleartext: false
  },
  android: {
    backgroundColor: '#042C53' // ton bleu foncé Awoundjô, pour l'écran de démarrage
  }
};

export default config;
