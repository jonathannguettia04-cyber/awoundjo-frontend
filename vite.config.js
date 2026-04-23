import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force vite 8 à utiliser l'entrée ESM d'axios
    // évite le bug "axios.create is undefined" en production
    mainFields: ["module", "main"],
  },
  optimizeDeps: {
    include: ["axios"],
  },
  build: {
    commonjsOptions: {
      include: [/axios/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});
