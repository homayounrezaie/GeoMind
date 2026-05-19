import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/GeoMind/',
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        app:        resolve(__dirname, 'pages/app.html'),
        jobposting: resolve(__dirname, 'pages/jobposting.html'),
        newsletter: resolve(__dirname, 'pages/newsletter.html'),
      },
    },
  },
});
