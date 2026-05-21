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
        paperWithCode: resolve(__dirname, 'pages/paper-with-code.html'),
        foundationModels: resolve(__dirname, 'pages/foundation-models.html'),
        datasets: resolve(__dirname, 'pages/datasets.html'),
        jobMarket: resolve(__dirname, 'pages/job-market.html'),
        companies: resolve(__dirname, 'pages/companies.html'),
        learn: resolve(__dirname, 'pages/learn.html'),
      },
    },
  },
});
