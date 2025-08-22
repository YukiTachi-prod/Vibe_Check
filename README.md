# 🚀 Vibe Check - Philippine Trends Monitor

**Vibe Check** is an AI-powered Web3 application that tracks and analyzes trending topics across Philippine social media, news sources, and online platforms. It provides real-time insights into what's hot online across politics, gaming, crypto, stocks, disasters, and news.

## ✨ Features

- **Real-time Trend Monitoring**: Scrapes and analyzes data from multiple Philippine sources every 15 minutes
- **Multi-Category Analysis**: Covers politics, gaming, cryptocurrency, stocks, disasters, and general news
- **AI-Powered Insights**: Natural language processing for sentiment analysis and keyword extraction
- **Web3 Integration**: Built on Base Sepolia testnet with blockchain capabilities
- **Beautiful UI**: Modern, responsive interface with real-time updates via WebSocket
- **Philippine Context**: Optimized for Filipino content and local trends

## 🏗️ Architecture

```
Vibe Check/
├── index.js              # Main Express server with WebSocket support
├── config.js             # Configuration (RPC endpoints, etc.)
├── scrapers/
│   └── scraper.js        # Data scraping from news sites and social media
├── analysis/
│   └── trendAnalyzer.js  # AI-powered trend analysis and sentiment detection
├── services/
│   └── web3Service.js    # Blockchain integration and wallet management
└── public/               # Frontend interface
    ├── index.html        # Main HTML template
    ├── styles.css        # Modern CSS with responsive design
    └── app.js           # Frontend JavaScript application
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome/Chromium (for Puppeteer web scraping)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Vibe_Check
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the application**
   - Update `config.js` with your Base Sepolia RPC endpoint
   - Add any additional news sources or social media platforms

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
BASE_RPC_URL=your_base_sepolia_rpc_url
NODE_ENV=development
```

### Customizing Data Sources

Edit `scrapers/scraper.js` to add or modify data sources:

```javascript
this.sources = {
  news: [
    'https://your-news-site.com',
    // Add more news sources
  ],
  social: [
    'https://twitter.com/search?q=philippines',
    // Add more social media sources
  ],
  // ... other categories
};
```

## 📊 Data Sources

### News & Media
- **Rappler** - Philippine news and analysis
- **PhilStar** - Breaking news and current events
- **GMA News** - Television and online news
- **ABS-CBN News** - Comprehensive news coverage
- **Inquirer.net** - Daily news and opinion

### Social Media
- **Twitter** - Real-time Philippine conversations
- **Reddit** - r/Philippines community discussions
- **Facebook** - Trending topics and viral content

### Specialized Sources
- **Crypto**: Cointelegraph, CoinDesk, Bitcoin.com
- **Gaming**: GameSpot, IGN, Polygon
- **Stocks**: Investing.com, MarketWatch, Bloomberg

## 🤖 AI Analysis Features

### Trend Detection
- **Frequency Analysis**: Identifies most mentioned topics
- **Philippine Keywords**: Boosts relevance for local terms
- **Trend Scoring**: Normalized scores (0-100) for comparison

### Sentiment Analysis
- **Positive/Negative/Neutral**: Basic sentiment classification
- **Keyword-based**: Analyzes emotional content in text
- **Real-time Updates**: Continuous sentiment monitoring

### Content Processing
- **Natural Language Processing**: Uses natural.js for text analysis
- **TF-IDF Keywords**: Extracts important terms and phrases
- **Source Attribution**: Tracks where trends originate

## 🔗 Web3 Integration

### Base Network Support
- **Testnet**: Base Sepolia for development and testing
- **Mainnet Ready**: Easy migration to Base mainnet
- **Smart Contract Ready**: Infrastructure for future tokenization

### Blockchain Features
- **Network Status**: Real-time connection monitoring
- **Wallet Management**: Create and manage wallets
- **Transaction Support**: Send and receive transactions
- **Gas Price Monitoring**: Network fee tracking

## 🎨 User Interface

### Dashboard
- **Overview Cards**: Quick insights for each category
- **Trend Scores**: Visual representation of topic popularity
- **Real-time Updates**: Live data refresh every 15 minutes

### Category Views
- **Detailed Analysis**: Deep dive into specific categories
- **Sentiment Indicators**: Visual sentiment representation
- **Source Breakdown**: Top sources and their contribution
- **Keyword Clouds**: Interactive topic exploration

### Responsive Design
- **Mobile First**: Optimized for all device sizes
- **Modern UI**: Glassmorphism and gradient design
- **Smooth Animations**: CSS transitions and micro-interactions

## 📱 API Endpoints

### Trends
- `GET /api/trends` - Get all category trends
- `GET /api/trends/:category` - Get trends for specific category

### Data Scraping
- `POST /api/scrape` - Trigger manual scraping with custom sources

### Web3 Status
- `GET /api/web3/status` - Get blockchain network status

### WebSocket Events
- `trends-update` - Real-time trend updates
- `subscribe` - Subscribe to category updates

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run scrape       # Run manual data scraping
npm run analyze      # Run trend analysis
```

### Adding New Categories
1. Update `analysis/trendAnalyzer.js` categories array
2. Add Philippine keywords for the category
3. Update frontend navigation and icons
4. Add data sources in `scrapers/scraper.js`

### Custom Scrapers
Extend the `DataScraper` class to add new scraping methods:

```javascript
async scrapeCustomSite(url, category) {
  // Implement custom scraping logic
  // Return structured data
}
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production RPC endpoints
3. Set up process manager (PM2, Docker, etc.)
4. Configure reverse proxy (Nginx, Apache)

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

- **Rate Limiting**: Implement API rate limiting
- **Input Validation**: Sanitize all user inputs
- **CORS Configuration**: Restrict cross-origin requests
- **Environment Variables**: Never commit sensitive data
- **Web Scraping Ethics**: Respect robots.txt and rate limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use ES6+ features
- Follow consistent naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Base Network** for blockchain infrastructure
- **Philippine News Sources** for content
- **Open Source Community** for libraries and tools

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Join our community discussions

---

**Vibe Check** - Stay connected to what's trending in the Philippines! 🇵🇭✨
