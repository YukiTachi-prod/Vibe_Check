import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ethers } from 'ethers';
import { config } from './config.js';
import { TrendAnalyzer } from './analysis/trendAnalyzer.js';
import { DataScraper } from './scrapers/scraper.js';
import { Web3Service } from './services/web3Service.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize services
const trendAnalyzer = new TrendAnalyzer();
const dataScraper = new DataScraper();
const web3Service = new Web3Service(config);

// Routes
app.get('/api/trends', async (req, res) => {
  try {
    const trends = await trendAnalyzer.getCurrentTrends();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trends/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const trends = await trendAnalyzer.getTrendsByCategory(category);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scrape', async (req, res) => {
  try {
    const { sources } = req.body;
    const scraped = await dataScraper.scrapeSources(sources);
    const analyzed = await trendAnalyzer.analyzeTrends(scraped);

    // Emit updates
    Object.keys(analyzed).forEach(category => {
      io.to(category).emit('trends-update', {
        category,
        trends: analyzed[category],
        timestamp: new Date().toISOString()
      });
    });

    res.json({ ok: true, analyzed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/web3/status', async (req, res) => {
  try {
    const status = await web3Service.getNetworkStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (category) => {
    socket.join(category);
    console.log(`Client ${socket.id} subscribed to ${category}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start scheduled scraping
import cron from 'node-cron';

// Scrape every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled scrape...');
  try {
    const results = await dataScraper.runScheduledScrape();
    const trends = await trendAnalyzer.analyzeTrends(results);
    
    // Emit real-time updates to connected clients
    Object.keys(trends).forEach(category => {
      io.to(category).emit('trends-update', {
        category,
        trends: trends[category],
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('Scheduled scrape completed successfully');
  } catch (error) {
    console.error('Scheduled scrape failed:', error);
  }
});

// Immediate scrape on startup
(async () => {
  try {
    console.log('Running initial scrape...');
    const initial = await dataScraper.runScheduledScrape();
    const analyzed = await trendAnalyzer.analyzeTrends(initial);

    // Emit once on startup
    Object.keys(analyzed).forEach(category => {
      io.to(category).emit('trends-update', {
        category,
        trends: analyzed[category],
        timestamp: new Date().toISOString()
      });
    });

    console.log('Initial scrape completed');
  } catch (err) {
    console.error('Initial scrape failed:', err.message);
  }
})();

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`🚀 Vibe Check server running on port ${PORT}`);
  console.log(`📊 Monitoring Philippine trends across politics, gaming, crypto, stocks, disasters, and news`);
  console.log(`🔗 Web3 integration: Base Sepolia testnet`);
});

export { app, io };