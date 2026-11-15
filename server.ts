import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getDonkiData, getOsdrData, getRadLabData } from './server/nasaHandlers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'moonstar-mission-server',
      runtime: 'express-dev',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/nasa/donki', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    const data = await getDonkiData({
      apiKey: process.env.NASA_API_KEY,
      forceRefresh,
    });
    return res.json(data);
  });

  app.get('/api/nasa/osdr', async (req, res) => {
    const query = req.query.q ? String(req.query.q) : undefined;
    const forceRefresh = req.query.refresh === '1';
    const data = await getOsdrData({ query, forceRefresh });
    return res.json(data);
  });

  app.get('/api/nasa/radlab', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    const data = await getRadLabData({ forceRefresh });
    return res.json(data);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MOONSTAR Mission Server running at http://localhost:${PORT}`);
  });
}

startServer();
