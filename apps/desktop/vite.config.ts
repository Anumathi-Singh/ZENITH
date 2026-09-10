import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), {
    name: "zenith-development-csp",
    apply: "serve",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
          .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
          .map(([, , body]) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`);
        return html.replace("script-src 'self';", `script-src 'self' ${hashes.join(" ")};`);
      },
    },
  }],
});
