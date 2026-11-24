import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development, serve /api/queue from the same handler Vercel runs in production,
// so `npm run dev` is the only command needed.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/queue', async (req, res) => {
        req.url = req.originalUrl;
        const mod = await server.ssrLoadModule('/api/queue.js');
        await mod.default(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  server: { host: true },
});
