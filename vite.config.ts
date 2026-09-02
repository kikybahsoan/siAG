import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './', // <-- Sangat penting agar aset path terbaca relatif di GitHub Pages
  plugins: [react(), tailwindcss()],
  // ...
});
