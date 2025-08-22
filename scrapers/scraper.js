import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export class DataScraper {
  constructor() {
    this.sources = {
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
    };
    
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async scrapeSources(sources = null) {
    const targetSources = sources || this.sources;
    const results = {};

    for (const [category, urls] of Object.entries(targetSources)) {
      results[category] = [];
      
      for (const url of urls) {
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
      } else {
        return await this.scrapeNewsSite(url, category);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
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
