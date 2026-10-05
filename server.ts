import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Spawn python ML microservice if not already running
const PY_PORT = 5001;
const pyService = spawn('python3', ['backend/py_service.py'], {
  stdio: 'inherit',
  detached: false
});

pyService.on('error', (err) => {
  console.error('Failed to spawn Python ML service:', err);
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CerviScan AI Clinical Decision Support Engine',
      model: 'RandomForestClassifier (300 trees, threshold 0.30)'
    });
  });

  // Proxy API endpoints to the Python service running the joblib pipeline
  const proxyToPython = async (req: express.Request, res: express.Response, method: string) => {
    const url = `http://127.0.0.1:${PY_PORT}${req.originalUrl}`;
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method === 'POST') {
        options.body = JSON.stringify(req.body);
      }
      const pyRes = await fetch(url, options);
      const data = await pyRes.json();
      res.status(pyRes.status).json(data);
    } catch (err: any) {
      console.error(`Error proxying ${req.originalUrl} to Python service:`, err);
      res.status(502).json({ error: 'Python ML service unavailable. Retrying...' });
    }
  };

  app.get('/api/stats', (req, res) => proxyToPython(req, res, 'GET'));
  app.get('/api/model-performance', (req, res) => proxyToPython(req, res, 'GET'));
  app.get('/api/insights', (req, res) => proxyToPython(req, res, 'GET'));
  app.get('/api/patients', (req, res) => proxyToPython(req, res, 'GET'));
  app.post('/api/predict', (req, res) => proxyToPython(req, res, 'POST'));

  // Setup Vite in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CerviScan AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
