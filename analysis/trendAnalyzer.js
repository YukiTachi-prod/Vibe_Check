import natural from 'natural';

export class TrendAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.categories = ['politics', 'gaming', 'crypto', 'stocks', 'disasters', 'news'];
    this.cachedTrends = null;
    
    // Philippine-specific keywords for better categorization
    this.philippineKeywords = {
      politics: [
        'duterte', 'marcos', 'aquino', 'senate', 'congress', 'malacañang', 'palace',
        'philippine', 'filipino', 'manila', 'quezon', 'makati', 'cebu', 'davao',
        'election', 'campaign', 'vote', 'president', 'vice president', 'senator',
        'representative', 'governor', 'mayor', 'barangay', 'lgu', 'local government'
      ],
      gaming: [
        'mobile legends', 'dota', 'valorant', 'csgo', 'league of legends', 'lol',
        'gaming', 'esports', 'tournament', 'championship', 'gamer', 'streamer',
        'youtuber', 'twitch', 'facebook gaming', 'nimo tv', 'kumu', 'bigo',
        'mobile game', 'pc game', 'console game', 'playstation', 'xbox', 'nintendo'
      ],
      crypto: [
        'bitcoin', 'ethereum', 'binance', 'coinbase', 'cryptocurrency', 'blockchain',
        'defi', 'nft', 'metamask', 'wallet', 'exchange', 'trading', 'mining',
        'philippine peso', 'php', 'usd', 'stablecoin', 'altcoin', 'token',
        'smart contract', 'web3', 'dao', 'yield farming', 'liquidity'
      ],
      stocks: [
        'psei', 'philippine stock exchange', 'index', 'market', 'trading',
        'investing', 'portfolio', 'dividend', 'earnings', 'revenue', 'profit',
        'loss', 'bull market', 'bear market', 'volatility', 'market cap',
        'blue chip', 'penny stock', 'ipo', 'initial public offering'
      ],
      disasters: [
        'typhoon', 'earthquake', 'flood', 'landslide', 'volcano', 'eruption',
        'tsunami', 'storm', 'hurricane', 'cyclone', 'natural disaster',
        'emergency', 'evacuation', 'relief', 'aid', 'rescue', 'damage',
        'casualty', 'injury', 'death', 'missing', 'affected'
      ],
      news: [
        'breaking', 'latest', 'update', 'report', 'announcement', 'statement',
        'press release', 'official', 'government', 'public', 'community',
        'society', 'culture', 'tradition', 'festival', 'celebration', 'event'
      ]
    };
  }

  async analyzeTrends(scrapedData) {
    const trends = {};
    
    for (const category of this.categories) {
      trends[category] = await this.analyzeCategory(category, scrapedData);
    }
    
    this.cachedTrends = trends;
    return trends;
  }

  setCachedTrends(trends) {
    this.cachedTrends = trends;
  }

  async getCurrentTrends() {
    if (this.cachedTrends) return this.cachedTrends;
    // default empty structure
    return {
      politics: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] },
      gaming: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] },
      crypto: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] },
      stocks: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] },
      disasters: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] },
      news: { trending: [], sentiment: 'neutral', volume: 0, topSources: [], keywords: [] }
    };
  }

  async getTrendsByCategory(category) {
    if (!this.categories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    const trends = await this.getCurrentTrends();
    return trends[category] || null;
  }

  async analyzeCategory(category, scrapedData) {
    const categoryData = scrapedData[category] || [];
    const allTexts = this.extractTexts(categoryData);
    
    if (allTexts.length === 0) {
      return {
        trending: [],
        sentiment: 'neutral',
        volume: 0,
        topSources: [],
        keywords: []
      };
    }

    const trending = this.extractTrendingTopics(allTexts, category);
    const sentiment = this.analyzeSentiment(allTexts);
    const volume = this.calculateVolume(categoryData);
    const topSources = this.getTopSources(categoryData);
    const keywords = this.extractKeywords(allTexts, category);

    return {
      trending,
      sentiment,
      volume,
      topSources,
      keywords,
      lastUpdated: new Date().toISOString()
    };
  }

  extractTexts(categoryData) {
    const texts = [];
    
    categoryData.forEach(source => {
      if (source.articles) {
        source.articles.forEach(article => {
          texts.push(article.title);
        });
      }
      if (source.posts) {
        source.posts.forEach(post => {
          texts.push(post.title || post.content || '');
        });
      }
    });
    
    return texts.filter(text => text && text.length > 0);
  }

  extractTrendingTopics(texts, category) {
    const wordFreq = {};
    const philippineKeywords = this.philippineKeywords[category] || [];
    
    texts.forEach(text => {
      const words = this.tokenizer.tokenize(text.toLowerCase());
      if (words) {
        words.forEach(word => {
          // Filter out common words and focus on relevant terms
          if (word.length > 3 && !this.isCommonWord(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });
      }
    });

    // Boost frequency for Philippine-specific keywords
    philippineKeywords.forEach(keyword => {
      if (wordFreq[keyword.toLowerCase()]) {
        wordFreq[keyword.toLowerCase()] *= 2;
      }
    });

    // Sort by frequency and return top trending topics
    const sorted = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, freq]) => ({
        topic: word,
        frequency: freq,
        score: this.calculateTrendScore(freq, texts.length)
      }));

    return sorted;
  }

  analyzeSentiment(texts) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'success', 'win', 'victory'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'failure', 'loss', 'defeat', 'disaster'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let totalWords = 0;

    texts.forEach(text => {
      const words = this.tokenizer.tokenize(text.toLowerCase());
      if (words) {
        words.forEach(word => {
          totalWords++;
          if (positiveWords.includes(word)) positiveCount++;
          if (negativeWords.includes(word)) negativeCount++;
        });
      }
    });

    if (totalWords === 0) return 'neutral';
    
    const positiveRatio = positiveCount / totalWords;
    const negativeRatio = negativeCount / totalWords;
    
    if (positiveRatio > negativeRatio && positiveRatio > 0.01) return 'positive';
    if (negativeRatio > positiveRatio && negativeRatio > 0.01) return 'negative';
    return 'neutral';
  }

  calculateVolume(categoryData) {
    let total = 0;
    
    categoryData.forEach(source => {
      if (source.articles) total += source.articles.length;
      if (source.posts) total += source.posts.length;
    });
    
    return total;
  }

  getTopSources(categoryData) {
    const sourceCounts = {};
    
    categoryData.forEach(source => {
      const domain = this.extractDomain(source.source);
      const count = (source.articles?.length || 0) + (source.posts?.length || 0);
      sourceCounts[domain] = (sourceCounts[domain] || 0) + count;
    });

    return Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }

  extractKeywords(texts, category) {
    const allWords = [];
    
    texts.forEach(text => {
      const words = this.tokenizer.tokenize(text.toLowerCase());
      if (words) {
        words.forEach(word => {
          if (word.length > 4 && !this.isCommonWord(word)) {
            allWords.push(word);
          }
        });
      }
    });

    // Use TF-IDF to find important keywords
    this.tfidf.addDocument(allWords.join(' '));
    const terms = this.tfidf.listTerms(0);
    
    return terms
      .slice(0, 15)
      .map(term => term.term)
      .filter(term => term.length > 3);
  }

  calculateTrendScore(frequency, totalTexts) {
    // Normalize score between 0-100
    const normalizedFreq = (frequency / totalTexts) * 100;
    return Math.min(Math.round(normalizedFreq * 10), 100);
  }

  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an', 'from'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  extractDomain(url) {
    try {
      const domain = new URL(url);
      return domain.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}
