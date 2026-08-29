import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Run AI EVOLUTION client on port 5180 to avoid conflicts with other local servers
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    host: true
  }
});
