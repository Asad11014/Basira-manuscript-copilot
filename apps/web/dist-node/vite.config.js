import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The web app talks to the API at VITE_API_URL (default localhost:4000).
// localhost is same-site across ports, so the httpOnly auth cookie flows with
// `credentials: 'include'` in dev. (See apps/web/src/api/client.ts)
export default defineConfig({
    plugins: [react()],
    server: {
        port: Number(process.env.WEB_PORT ?? 5173),
        strictPort: false,
    },
});
//# sourceMappingURL=vite.config.js.map