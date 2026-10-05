import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { authoritativeEngine } from './backend/authoritative_engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON middleware with error handling
  app.use(express.json());

  // CORS and standard headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CerviScan AI Clinical Decision Support Engine',
      model: 'RandomForestClassifier (300 trees, threshold 0.30)',
      dataset: '858 patient clinical records (UCI Cervical Cancer Risk Factors)'
    });
  });

  // Dataset Statistics & Demographics
  app.get('/api/stats', (req, res) => {
    try {
      const stats = authoritativeEngine.getStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Error in /api/stats:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Model Performance (Confusion matrix, ROC-AUC, PR-AUC, Threshold sweep)
  app.get('/api/model-performance', (req, res) => {
    try {
      const perf = authoritativeEngine.getModelPerformance();
      res.json(perf);
    } catch (err: any) {
      console.error('Error in /api/model-performance:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Insights (Feature importances, correlations with Biopsy, missing values, mean comparisons)
  app.get('/api/insights', (req, res) => {
    try {
      const insights = authoritativeEngine.getInsights();
      res.json(insights);
    } catch (err: any) {
      console.error('Error in /api/insights:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Patient Records (All 858 records with search, filter, pagination)
  app.get('/api/patients', (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string, 10) : 25;
      const search = (req.query.search as string) || '';
      const biopsy = (req.query.biopsy as string) || 'all';
      const risk = (req.query.risk as string) || 'all';

      const result = authoritativeEngine.getPatients({
        page,
        pageSize,
        search,
        biopsy,
        risk
      });
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/patients:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Risk Prediction inference
  app.post('/api/predict', (req, res) => {
    try {
      const input = req.body || {};
      const result = authoritativeEngine.predict(input);
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/predict:', err);
      res.status(400).json({ error: err.message || 'Invalid input for prediction' });
    }
  });

  // Explicitly guard all /api routes from falling through to Vite SPA index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found` });
  });

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
