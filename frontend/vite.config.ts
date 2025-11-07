import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendPort = Number.parseInt(env.FRONTEND_PORT ?? "5173", 10);

  return {
    server: {
      port: Number.isNaN(frontendPort) ? 5173 : frontendPort,
    },
    plugins: [tailwindcss(), sveltekit()],
  };
});
