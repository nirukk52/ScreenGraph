/**
 * Tailwind CSS v4 Configuration Shim
 *
 * NOTE: Tailwind v4 doesn't use this file for configuration.
 * All theming is done via @theme in src/app.css
 *
 * This file exists for IDE compatibility only.
 *
 * See: https://tailwindcss.com/docs/v4-beta
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
};

export default config;
