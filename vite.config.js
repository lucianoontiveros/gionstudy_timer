import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'; default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' wss://*.tmi.twitch.tv wss://*.twitch.tv https://*.twitch.tv https://*.ttvnw.net; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  },
  preview: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'; default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' wss://*.tmi.twitch.tv wss://*.twitch.tv https://*.twitch.tv https://*.ttvnw.net; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  }
})
