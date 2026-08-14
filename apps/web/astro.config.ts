/** Astro configuration keeps the public portfolio static and fast at the edge. */
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://462019.xyz",
  integrations: [react()],
  output: "static",
  vite: { server: { proxy: { "/api": "http://localhost:8787" } } }
});

