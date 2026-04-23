import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
  optimizeDeps: {
    include: ["axios"],
    rolldownOptions: {
      mainFields: ["browser", "module", "main"],
    },
  },
  build: {
    commonjsOptions: {
      include: [/axios/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});