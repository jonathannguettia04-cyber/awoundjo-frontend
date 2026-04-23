import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force la version browser d'axios
      axios: "axios/dist/browser/axios.cjs",
    },
  },
  optimizeDeps: {
    include: ["axios"],
  },
});