import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
  },
  plugins: [sveltekit()],
});
