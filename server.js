import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Health check endpoint for Cloud Run / load balancers
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Path to Vite build output directory
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(distDir)) {
  // Serve static assets from dist
  app.use(express.static(distDir));

  // SPA fallback route for React router / client paths
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  // Fallback if dist has not been generated yet
  app.get('*', (_req, res) => {
    res.status(503).send('App is initializing, please reload shortly.');
  });
}

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
