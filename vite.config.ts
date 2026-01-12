import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(env.VITE_RESEND_API_KEY),
        'import.meta.env.VITE_EMAIL_PROXY_URL': JSON.stringify(env.VITE_EMAIL_PROXY_URL)
      }
    };
});
