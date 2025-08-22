import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    // Server Configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Base Network Configuration - Multiple fallback endpoints
    rpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
    fallbackRpcUrls: [
        'https://sepolia.base.org',
        'https://base-sepolia.public.blastapi.io',
        'https://base-sepolia.drpc.org',
        'https://1rpc.io/base-sepolia'
    ],
    
    // Web Scraping Configuration
    scrapeInterval: parseInt(process.env.SCRAPE_INTERVAL) || 900000, // 15 minutes
    maxConcurrentScrapes: parseInt(process.env.MAX_CONCURRENT_SCRAPES) || 5,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
    
    // AI Analysis Configuration
    sentimentThreshold: parseFloat(process.env.SENTIMENT_THRESHOLD) || 0.01,
    maxKeywords: parseInt(process.env.MAX_KEYWORDS) || 15,
    trendScoreMultiplier: parseInt(process.env.TREND_SCORE_MULTIPLIER) || 10,
    
    // Security Configuration
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/vibe-check.log',
    
    // Data Sources (can be customized)
    sources: {
        news: [
            'https://www.rappler.com',
            'https://www.philstar.com',
            'https://www.gmanews.tv',
            'https://www.abs-cbn.com/news',
            'https://www.inquirer.net'
        ],
        social: [
            'https://twitter.com/search?q=philippines&src=typed_query&f=live',
            'https://www.reddit.com/r/Philippines/',
            'https://www.facebook.com/search/top/?q=philippines'
        ],
        crypto: [
            'https://cointelegraph.com/tags/philippines',
            'https://coindesk.com/tag/philippines/',
            'https://www.bitcoin.com/news/tag/philippines/'
        ],
        gaming: [
            'https://www.gamespot.com/news/',
            'https://www.ign.com/news/',
            'https://www.polygon.com/news'
        ],
        stocks: [
            'https://www.investing.com/equities/philippines',
            'https://www.marketwatch.com/investing/index/psei',
            'https://www.bloomberg.com/markets/stocks/philippines'
        ]
    }
};

// Validate configuration
if (!config.rpcUrl) {
    console.warn('Warning: No Base RPC URL configured. Web3 features will be disabled.');
}

if (config.nodeEnv === 'production') {
    console.log('Running in production mode');
    // Add production-specific configurations here
}

export default config;