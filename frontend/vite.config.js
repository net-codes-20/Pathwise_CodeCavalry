import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Read the single root .env (repo_root/.env) instead of frontend/.env —
  // only VITE_-prefixed variables are exposed to client code either way.
  envDir: "../",
  server: {
    port: 5173,
  },
});
