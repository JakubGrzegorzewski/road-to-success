import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Enable JSON body parsing
app.use(express.json({ limit: '50mb' }));

// Proxy for PDF generation API
app.post('/generate-pdf', async (req, res) => {
  try {
    const response = await fetch('https://api.grzegorzewski.app/generate-pdf/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      console.error('PDF API error:', response.status, response.statusText);
      return res.status(response.status).json({ error: 'Failed to generate PDF' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      const text = await response.text();
      console.error('PDF API returned non-PDF response. Content-Type:', contentType, '\nBody:', text.substring(0, 500));
      return res.status(502).json({ error: 'API did not return a PDF', contentType, detail: text.substring(0, 500) });
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'application/pdf');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error proxying PDF request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

