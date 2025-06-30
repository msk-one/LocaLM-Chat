import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  base: './', // Required for Electron file protocol
  build: {
    outDir: 'dist',
    assetsDir: '.', // Keep assets in root for Electron compatibility
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    },
    commonjsOptions: {
      include: [/dompurify/, /node_modules/]
    },
    copyPublicDir: true // Ensure public files are copied to dist
  },
  server: {
    port: 5173,
    strictPort: true // Ensure port is always 5173
  }
});
