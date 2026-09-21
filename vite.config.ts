import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function syncProxyPlugin(): Plugin {
  return {
    name: 'sync-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.includes('/api/sync-proxy')) {
          return next();
        }

        // Set permissive CORS headers for all proxy responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(reqUrl, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Parameter target URL tidak ditemukan.' }));
            return;
          }

          if (req.method === 'GET') {
            const resp = await fetch(targetUrl, { redirect: 'follow' });
            const data = await resp.text();
            res.statusCode = resp.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } else if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            req.on('end', async () => {
              try {
                const body = Buffer.concat(chunks).toString('utf-8');
                const resp = await fetch(targetUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain' },
                  body,
                  redirect: 'follow',
                });
                const data = await resp.text();
                res.statusCode = resp.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
              } catch (postErr: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'error', message: postErr.message || 'POST proxy error' }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end('Method Not Allowed');
          }
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'error', message: err.message || 'Proxy error' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  const base = process.env.BASE_URL || (process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : './');
  return {
    base,
    plugins: [react(), tailwindcss(), syncProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
