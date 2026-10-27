import { defineConfig } from "vite";
export default defineConfig({
  root: ".",
  // Instância nova; preservar dist-v10 e todas as instâncias anteriores.
  build: { outDir: "dist-v11", emptyOutDir: false,
    rollupOptions:{input:{main:'index.html',atlasPreview:'atlas-preview.html'}},
  },
  server: { host: "127.0.0.1" },
});
