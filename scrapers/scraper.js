import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export class DataScraper {
  constructor() {
    this.sources = {
      politics: [
        // Philippine News Sources
        'https://www.rappler.com/nation',
        'https://www.philstar.com/headlines',
        'https://www.gmanews.tv/topstories',
        'https://www.abs-cbn.com/news/nation',
        'https://www.inquirer.net/news',
        'https://www.manilatimes.net',
        'https://www.sunstar.com.ph',
        'https://www.mindanews.com',
        // Government Sources
        'https://www.officialgazette.gov.ph',
        'https://www.senate.gov.ph',
        'https://www.congress.gov.ph',
        'https://www.president.gov.ph'
      ],
      gaming: [
        // International Gaming News
        'https://www.gamespot.com/news/',
        'https://www.ign.com/news/',
        'https://www.polygon.com/news',
        'https://www.pcgamer.com/news/',
        'https://www.eurogamer.net/news',
        // Philippine Gaming Sources
        'https://www.esportsphilippines.com',
        'https://www.gamingphilippines.com',
        'https://www.mobilelegends.com',
        'https://www.valorant.com/en-us/news',
        // Streaming Platforms
        'https://www.twitch.tv/directory/game',
        'https://www.facebook.com/gaming',
        'https://www.youtube.com/gaming'
      ],
      crypto: [
        // International Crypto News
        'https://cointelegraph.com/tags/philippines',
        'https://coindesk.com/tag/philippines/',
        'https://www.bitcoin.com/news/tag/philippines/',
        'https://decrypt.co',
        'https://www.theblock.co',
        // Philippine Crypto Sources
        'https://www.bsp.gov.ph/Regulations/Regulations.asp',
        'https://www.pda.ph',
        'https://www.bitpinas.com',
        'https://www.cryptocompare.com',
        // Exchange News
        'https://www.binance.com/en/news',
        'https://blog.coinbase.com',
        'https://www.kraken.com/news'
      ],
      stocks: [
        // Philippine Stock Market
        'https://www.investing.com/equities/philippines',
        'https://www.marketwatch.com/investing/index/psei',
        'https://www.bloomberg.com/markets/stocks/philippines',
        'https://www.reuters.com/markets/companies',
        'https://www.cnbc.com/markets',
        // Local Financial News
        'https://www.bsp.gov.ph',
        'https://www.pse.com.ph',
        'https://www.sec.gov.ph',
        'https://www.icap.com.ph',
        // International Markets
        'https://www.yahoo.com/finance',
        'https://www.marketwatch.com',
        'https://www.investing.com'
      ],
      disasters: [
        // Philippine Disaster Agencies
        'https://www.ndrrmc.gov.ph',
        'https://www.phivolcs.dost.gov.ph',
        'https://www.pagasa.dost.gov.ph',
        'https://www.mgb.gov.ph',
        'https://www.denr.gov.ph',
        // International Disaster Sources
        'https://www.gdacs.org',
        'https://www.reliefweb.int',
        'https://www.usgs.gov/natural-hazards',
        'https://www.who.int/emergencies',
        // News Sources for Disasters
        'https://www.rappler.com/nation/disasters',
        'https://www.philstar.com/headlines/disasters',
        'https://www.gmanews.tv/topstories/disasters'
      ],
      news: [
        // Philippine News Sources
        'https://www.rappler.com',
        'https://www.philstar.com',
        'https://www.gmanews.tv',
        'https://www.abs-cbn.com/news',
        'https://www.inquirer.net',
        'https://www.manilatimes.net',
        'https://www.sunstar.com.ph',
        'https://www.mindanews.com',
        // International News
        'https://www.reuters.com',
        'https://www.bbc.com/news',
        'https://www.cnn.com',
        'https://www.aljazeera.com/news',
        // Social Media Trends
        'https://twitter.com/search?q=philippines&src=typed_query&f=live',
        'https://www.reddit.com/r/Philippines/',
        'https://www.facebook.com/search/top/?q=philippines'
      ]
    };
    
    this.browser = null;
    this.specializedScrapers = {
      politics: this.scrapePolitics.bind(this),
      gaming: this.scrapeGaming.bind(this),
      crypto: this.scrapeCrypto.bind(this),
      stocks: this.scrapeStocks.bind(this),
      disasters: this.scrapeDisasters.bind(this),
      news: this.scrapeNews.bind(this)
    };
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
    }
    return this.browser;
  }

  async scrapeSources(sources = null) {
    const targetSources = sources || this.sources;
    const results = {};

    for (const [category, urls] of Object.entries(targetSources)) {
      console.log(`Starting to scrape ${category} category...`);
      results[category] = [];
      
      // Use specialized scraper if available
      if (this.specializedScrapers[category]) {
        try {
          const specializedData = await this.specializedScrapers[category](urls);
          if (specializedData) {
            results[category].push(specializedData);
          }
        } catch (error) {
          console.error(`Error in specialized scraping for ${category}:`, error.message);
        }
      }
      
      // Also run general scraping as fallback
      for (const url of urls.slice(0, 5)) { // Limit to 5 URLs per category for performance
        try {
          const data = await this.scrapeUrl(url, category);
          if (data) {
            results[category].push(data);
          }
        } catch (error) {
          console.error(`Error scraping ${url}:`, error.message);
        }
      }
    }

    return results;
  }

  async scrapeUrl(url, category) {
    try {
      if (url.includes('twitter.com') || url.includes('facebook.com') || url.includes('reddit.com')) {
        return await this.scrapeSocialMedia(url, category);
      } else if (url.includes('youtube.com')) {
        return await this.scrapeYouTube(url, category);
      } else {
        return await this.scrapeNewsSite(url, category);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      return null;
    }
  }

  // Specialized Politics Scraper
  async scrapePolitics(urls) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const politicsData = {
        source: 'politics-specialized',
        category: 'politics',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Scrape government websites for official announcements
      for (const url of urls.filter(u => u.includes('gov.ph'))) {
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          
          const announcements = await page.evaluate(() => {
            const items = [];
            // Look for common government announcement selectors
            const selectors = [
              'h1, h2, h3',
              '.announcement, .news-item, .press-release',
              '.content h1, .content h2, .content h3'
            ];
            
            selectors.forEach(selector => {
              document.querySelectorAll(selector).forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 20 && text.length < 200) {
                  items.push({
                    title: text,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    source: 'government'
                  });
                }
              });
            });
            
            return items;
          });
          
          politicsData.articles.push(...announcements);
        } catch (error) {
          console.error(`Error scraping government site ${url}:`, error.message);
        }
      }

      await page.close();
      return politicsData;
    } catch (error) {
      console.error('Error in specialized politics scraping:', error.message);
      return null;
    }
  }

  // Specialized Gaming Scraper
  async scrapeGaming(urls) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const gamingData = {
        source: 'gaming-specialized',
        category: 'gaming',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Scrape Twitch for live gaming trends
      try {
        await page.goto('https://www.twitch.tv/directory/game', { waitUntil: 'networkidle2', timeout: 15000 });
        
        const twitchTrends = await page.evaluate(() => {
          const trends = [];
          const gameElements = document.querySelectorAll('[data-a-target="game-card"]');
          
          gameElements.slice(0, 10).forEach(game => {
            const titleEl = game.querySelector('[data-a-target="game-card-title"]');
            const viewerEl = game.querySelector('[data-a-target="game-card-viewer-count"]');
            
            if (titleEl) {
              trends.push({
                title: titleEl.textContent.trim(),
                viewers: viewerEl ? viewerEl.textContent.trim() : 'Unknown',
                platform: 'twitch',
                timestamp: new Date().toISOString()
              });
            }
          });
          
          return trends;
        });
        
        gamingData.posts.push(...twitchTrends);
      } catch (error) {
        console.error('Error scraping Twitch:', error.message);
      }

      await page.close();
      return gamingData;
    } catch (error) {
      console.error('Error in specialized gaming scraping:', error.message);
      return null;
    }
  }

  // Specialized Crypto Scraper
  async scrapeCrypto(urls) {
    try {
      const cryptoData = {
        source: 'crypto-specialized',
        category: 'crypto',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Get real-time crypto prices for Philippine peso pairs
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=php,usd', {
          timeout: 10000
        });
        
        if (response.data) {
          const priceData = {
            title: 'Real-time Crypto Prices (PHP)',
            content: `Bitcoin: ₱${response.data.bitcoin?.php?.toLocaleString() || 'N/A'}, Ethereum: ₱${response.data.ethereum?.php?.toLocaleString() || 'N/A'}`,
            platform: 'coingecko',
            timestamp: new Date().toISOString()
          };
          cryptoData.posts.push(priceData);
        }
      } catch (error) {
        console.error('Error fetching crypto prices:', error.message);
      }

      return cryptoData;
    } catch (error) {
      console.error('Error in specialized crypto scraping:', error.message);
      return null;
    }
  }

  // Specialized Stocks Scraper
  async scrapeStocks(urls) {
    try {
      const stocksData = {
        source: 'stocks-specialized',
        category: 'stocks',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Get PSEI data (Philippine Stock Exchange Index)
      try {
        const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/PSEI.PS', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.chart && response.data.chart.result) {
          const result = response.data.chart.result[0];
          const currentPrice = result.meta.regularMarketPrice;
          const change = result.meta.regularMarketPrice - result.meta.previousClose;
          const changePercent = (change / result.meta.previousClose) * 100;
          
          const marketData = {
            title: `PSEI: ${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)} ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
            content: `Philippine Stock Exchange Index current market data`,
            platform: 'yahoo-finance',
            timestamp: new Date().toISOString()
          };
          stocksData.posts.push(marketData);
        }
      } catch (error) {
        console.error('Error fetching PSEI data:', error.message);
      }

      return stocksData;
    } catch (error) {
      console.error('Error in specialized stocks scraping:', error.message);
      return null;
    }
  }

  // Specialized Disasters Scraper
  async scrapeDisasters(urls) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const disastersData = {
        source: 'disasters-specialized',
        category: 'disasters',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Scrape PAGASA for weather alerts
      try {
        await page.goto('https://www.pagasa.dost.gov.ph', { waitUntil: 'networkidle2', timeout: 15000 });
        
        const weatherAlerts = await page.evaluate(() => {
          const alerts = [];
          const alertElements = document.querySelectorAll('.alert, .warning, .notice');
          
          alertElements.forEach(alert => {
            const text = alert.textContent.trim();
            if (text.length > 20) {
              alerts.push({
                title: text.substring(0, 100),
                content: text,
                platform: 'pagasa',
                timestamp: new Date().toISOString()
              });
            }
          });
          
          return alerts;
        });
        
        disastersData.posts.push(...weatherAlerts);
      } catch (error) {
        console.error('Error scraping PAGASA:', error.message);
      }

      await page.close();
      return disastersData;
    } catch (error) {
      console.error('Error in specialized disasters scraping:', error.message);
      return null;
    }
  }

  // Specialized News Scraper
  async scrapeNews(urls) {
    try {
      const newsData = {
        source: 'news-specialized',
        category: 'news',
        articles: [],
        posts: [],
        scrapedAt: new Date().toISOString()
      };

      // Get trending topics from multiple sources
      const trendingSources = urls.filter(u => 
        u.includes('rappler.com') || 
        u.includes('philstar.com') || 
        u.includes('gmanews.tv')
      );

      for (const url of trendingSources.slice(0, 3)) {
        try {
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          const headlines = [];

          // Look for headline selectors
          $('h1, h2, h3, .headline, .title').each((i, element) => {
            const text = $(element).text().trim();
            if (text.length > 20 && text.length < 200) {
              headlines.push({
                title: text,
                url: url,
                source: this.extractDomain(url),
                timestamp: new Date().toISOString()
              });
            }
          });

          newsData.articles.push(...headlines.slice(0, 5));
        } catch (error) {
          console.error(`Error scraping news from ${url}:`, error.message);
        }
      }

      return newsData;
    } catch (error) {
      console.error('Error in specialized news scraping:', error.message);
      return null;
    }
  }

  async scrapeNewsSite(url, category) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      // Generic selectors for common news sites
      const selectors = [
        'h1, h2, h3',
        '.headline, .title, .article-title',
        '.news-item, .article, .story',
        '.content, .main-content'
      ];

      selectors.forEach(selector => {
        $(selector).each((i, element) => {
          const text = $(element).text().trim();
          if (text.length > 20 && text.length < 200) {
            articles.push({
              title: text,
              url: url,
              category: category,
              timestamp: new Date().toISOString(),
              source: this.extractDomain(url)
            });
          }
        });
      });

      return {
        source: url,
        category: category,
        articles: articles.slice(0, 10), // Limit to 10 articles
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error scraping news site ${url}:`, error.message);
      return null;
    }
  }

  async scrapeSocialMedia(url, category) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      let posts = [];
      
      if (url.includes('reddit.com')) {
        posts = await this.scrapeReddit(page);
      } else if (url.includes('twitter.com')) {
        posts = await this.scrapeTwitter(page);
      }

      await page.close();

      return {
        source: url,
        category: category,
        posts: posts.slice(0, 15), // Limit to 15 posts
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error scraping social media ${url}:`, error.message);
      return null;
    }
  }

  async scrapeYouTube(url, category) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const videos = await page.evaluate(() => {
        const videoItems = [];
        const videoElements = document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer');
        
        videoElements.slice(0, 10).forEach(video => {
          const titleEl = video.querySelector('#video-title, #video-title-link');
          const channelEl = video.querySelector('#channel-name, #channel-name a');
          const viewsEl = video.querySelector('#metadata-line, #metadata');
          
          if (titleEl) {
            videoItems.push({
              title: titleEl.textContent.trim(),
              channel: channelEl ? channelEl.textContent.trim() : 'Unknown',
              views: viewsEl ? viewsEl.textContent.trim() : 'Unknown',
              platform: 'youtube',
              timestamp: new Date().toISOString()
            });
          }
        });
        
        return videoItems;
      });

      await page.close();

      return {
        source: url,
        category: category,
        posts: videos,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error scraping YouTube ${url}:`, error.message);
      return null;
    }
  }

  async scrapeReddit(page) {
    return await page.evaluate(() => {
      const posts = [];
      const postElements = document.querySelectorAll('[data-testid="post-container"]');
      
      postElements.forEach((post, index) => {
        if (index < 15) {
          const titleElement = post.querySelector('h3');
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          if (title.length > 10) {
            posts.push({
              title: title,
              platform: 'reddit',
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
      return posts;
    });
  }

  async scrapeTwitter(page) {
    return await page.evaluate(() => {
      const tweets = [];
      const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
      
      tweetElements.forEach((tweet, index) => {
        if (index < 15) {
          const textElement = tweet.querySelector('[data-testid="tweetText"]');
          const text = textElement ? textElement.textContent.trim() : '';
          
          if (text.length > 20) {
            tweets.push({
              content: text,
              platform: 'twitter',
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
      return tweets;
    });
  }

  async runScheduledScrape() {
    console.log('Starting scheduled scrape...');
    const results = await this.scrapeSources();
    console.log('Scheduled scrape completed');
    return results;
  }

  extractDomain(url) {
    try {
      const domain = new URL(url);
      return domain.hostname;
    } catch {
      return url;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
