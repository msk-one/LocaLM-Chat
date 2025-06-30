import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Security middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(limiter);

const PORT = process.env.PROXY_PORT || 3001;
const LLM_HOST = process.env.LLM_HOST || 'localhost';
const LLM_PORT = process.env.LLM_PORT || '';

// Enable CORS for all origins in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available models endpoint
app.get('/models', async (req, res) => {
  try {
    const targetUrl = LLM_PORT ? `http://${LLM_HOST}:${LLM_PORT}` : `http://${LLM_HOST}`;
    const response = await fetch(`${targetUrl}/engines/llama.cpp/v1/models`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models', message: error.message });
  }
});

// Proxy all /v1/* requests to LLM server
// Note: Don't use express.json() before proxy middleware as it consumes the request body
app.use('/v1', createProxyMiddleware({
  target: LLM_PORT ? `http://${LLM_HOST}:${LLM_PORT}` : `http://${LLM_HOST}`,
  changeOrigin: true,
  timeout: 300000, // 5 minutes timeout for R1 models
  proxyTimeout: 300000, // 5 minutes proxy timeout
  pathRewrite: {
    '^/v1': '/engines/llama.cpp/v1'  // Rewrite path to match Docker Model Runner API
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log the request for debugging
    const targetUrl = LLM_PORT ? `${LLM_HOST}:${LLM_PORT}` : LLM_HOST;
    console.log(`Proxying ${req.method} ${req.originalUrl} to ${targetUrl}${proxyReq.path}`);
    
    // Set longer timeout for streaming requests
    proxyReq.setTimeout(300000); // 5 minutes
    
    // Handle R1 model specific headers
    if (req.body && typeof req.body === 'object') {
      const modelName = req.body.model || '';
      if (modelName.toLowerCase().includes('r1') || modelName.toLowerCase().includes('thinking')) {
        console.log('Detected R1-class model, applying enhanced streaming handling');
        proxyReq.setHeader('X-R1-Model', 'true');
      }
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Enhanced SSE handling for R1 models
    if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
      proxyRes.headers['cache-control'] = 'no-cache';
      proxyRes.headers['connection'] = 'keep-alive';
      proxyRes.headers['x-accel-buffering'] = 'no';
      
      // Additional headers for R1 model stability
      proxyRes.headers['transfer-encoding'] = 'chunked';
      proxyRes.headers['access-control-allow-origin'] = '*';
      
      // Set response timeout
      res.setTimeout(300000); // 5 minutes
      
      console.log(`Streaming response initiated for ${req.originalUrl}`);
    }
    
    // Log response status for debugging
    console.log(`Response status: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', {
      message: err.message,
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Enhanced error response
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Proxy error',
        message: err.message,
        code: err.code,
        timestamp: new Date().toISOString(),
        suggestion: 'This may be related to R1 model streaming. Check LLM server status.'
      });
    }
  },
  // Additional options for R1 model stability
  selfHandleResponse: false,
  buffer: false, // Don't buffer for streaming
  followRedirects: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  const targetUrl = LLM_PORT ? `${LLM_HOST}:${LLM_PORT}` : LLM_HOST;
  console.log(`Forwarding to LLM server at ${targetUrl}`);
});