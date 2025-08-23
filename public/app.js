class VibeCheckApp {
    constructor() {
        this.socket = null;
        this.currentCategory = 'all';
        this.trendsData = {};
        this.init();
    }

    init() {
        this.loadSettings(); // Load saved settings first
        this.initializeSocket();
        this.bindEvents();
        this.checkWeb3Status();
        this.loadInitialData();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('subscribe', 'all');
        });

        this.socket.on('trends-update', (data) => {
            console.log('Received trends update:', data);
            this.updateTrends(data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.switchCategory(category);
            });
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showDashboard();
        });

        // Settings button
        document.getElementById('headerBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // Trend card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.trend-card')) {
                const category = e.target.closest('.trend-card').dataset.category;
                this.showCategoryDetails(category);
            }
        });

        // Raw posts controls
        document.getElementById('refreshPostsBtn').addEventListener('click', () => {
            this.refreshRawPosts();
        });

        document.getElementById('sampleDataBtn').addEventListener('click', () => {
            this.showSampleData();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterRawPosts(e.target.value);
        });
    }

    async checkWeb3Status() {
        try {
            const response = await fetch('/api/web3/status');
            const status = await response.json();
            
            const statusElement = document.getElementById('web3Status');
            if (status.connected) {
                statusElement.className = 'status-indicator connected';
                            statusElement.innerHTML = `
                <i class="fas fa-circle"></i>
                Connected to ${status.network.name} (${status.network.chainId}) via ${status.endpoint || 'Primary'}
            `;
            } else {
                statusElement.className = 'status-indicator error';
                statusElement.innerHTML = `
                    <i class="fas fa-circle"></i>
                    Connection Error
                `;
            }
        } catch (error) {
            console.error('Failed to check Web3 status:', error);
            const statusElement = document.getElementById('web3Status');
            statusElement.className = 'status-indicator error';
            statusElement.innerHTML = `
                <i class="fas fa-circle"></i>
                Connection Failed
            `;
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/trends');
            const trends = await response.json();
            this.trendsData = trends;
            this.renderDashboard(trends);
            this.updateLastUpdated();
            
            // Also populate raw posts section
            this.renderRawPosts(trends);
            
            // If no real data, show sample data for testing
            if (!trends || Object.keys(trends).length === 0 || Object.values(trends).every(data => !data || (Array.isArray(data) && data.length === 0))) {
                console.log('No real data available, showing sample data for testing');
                this.showSampleData();
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load trends data');
            // Show sample data on error
            this.showSampleData();
        } finally {
            this.showLoading(false);
        }
    }

    showSampleData() {
        const sampleTrends = {
            politics: [
                {
                    source: 'rappler.com',
                    category: 'politics',
                    articles: [
                        {
                            title: 'Senate approves new bill on digital transformation',
                            url: 'https://rappler.com/sample-article-1',
                            timestamp: new Date().toISOString(),
                            source: 'rappler.com'
                        },
                        {
                            title: 'Congressional hearing on economic recovery plan',
                            url: 'https://rappler.com/sample-article-2',
                            timestamp: new Date(Date.now() - 3600000).toISOString(),
                            source: 'rappler.com'
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ],
            gaming: [
                {
                    source: 'twitch.tv',
                    category: 'gaming',
                    posts: [
                        {
                            title: 'Mobile Legends tournament reaches 100k viewers',
                            content: 'Philippine Mobile Legends Championship breaks viewership records',
                            platform: 'twitch',
                            timestamp: new Date().toISOString()
                        },
                        {
                            title: 'Valorant esports team qualifies for international tournament',
                            content: 'Local Valorant team makes history with international qualification',
                            platform: 'twitch',
                            timestamp: new Date(Date.now() - 7200000).toISOString()
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ],
            crypto: [
                {
                    source: 'coingecko-api',
                    category: 'crypto',
                    posts: [
                        {
                            title: 'Bitcoin price reaches ₱3.2M in Philippine markets',
                            content: 'Cryptocurrency adoption continues to grow in the Philippines',
                            platform: 'coingecko',
                            timestamp: new Date().toISOString()
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ],
            stocks: [
                {
                    source: 'yahoo-finance',
                    category: 'stocks',
                    posts: [
                        {
                            title: 'PSEI gains 2.5% on positive economic outlook',
                            content: 'Philippine Stock Exchange Index shows strong performance',
                            platform: 'yahoo-finance',
                            timestamp: new Date().toISOString()
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ],
            disasters: [
                {
                    source: 'pagasa.gov.ph',
                    category: 'disasters',
                    posts: [
                        {
                            title: 'Weather alert: Tropical depression approaching Luzon',
                            content: 'PAGASA issues weather warning for northern provinces',
                            platform: 'pagasa',
                            timestamp: new Date().toISOString()
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ],
            news: [
                {
                    source: 'philstar.com',
                    category: 'news',
                    articles: [
                        {
                            title: 'Breaking: Major infrastructure project announced',
                            url: 'https://philstar.com/sample-news-1',
                            timestamp: new Date().toISOString(),
                            source: 'philstar.com'
                        }
                    ],
                    scrapedAt: new Date().toISOString()
                }
            ]
        };
        
        this.trendsData = sampleTrends;
        this.renderDashboard(sampleTrends);
        this.renderRawPosts(sampleTrends);
    }

    switchCategory(category) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Subscribe to category updates
        if (this.socket && this.socket.connected) {
            this.socket.emit('subscribe', category);
        }

        this.currentCategory = category;

        if (category === 'all') {
            this.showDashboard();
        } else {
            this.showCategoryDetails(category);
        }
    }

    showDashboard() {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('categoryDetails').style.display = 'none';
        this.currentCategory = 'all';
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-category="all"]').classList.add('active');
    }

    async showCategoryDetails(category) {
        try {
            this.showLoading(true);
            
            // Hide dashboard, show category details
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('categoryDetails').style.display = 'block';
            
            // Update category title
            document.getElementById('categoryTitle').textContent = this.getCategoryDisplayName(category);
            
            // Load category data
            const response = await fetch(`/api/trends/${category}`);
            const categoryData = await response.json();
            
            if (categoryData) {
                this.renderCategoryDetails(category, categoryData);
            } else {
                this.showError('No data available for this category');
            }
        } catch (error) {
            console.error('Failed to load category details:', error);
            this.showError('Failed to load category details');
        } finally {
            this.showLoading(false);
        }
    }

    renderDashboard(trends) {
        const trendsGrid = document.getElementById('trendsGrid');
        trendsGrid.innerHTML = '';

        Object.entries(trends).forEach(([category, data]) => {
            const trendCard = this.createTrendCard(category, data);
            trendsGrid.appendChild(trendCard);
        });
    }

    createTrendCard(category, data) {
        const card = document.createElement('div');
        card.className = 'trend-card';
        card.dataset.category = category;

        const iconClass = this.getCategoryIcon(category);
        const displayName = this.getCategoryDisplayName(category);
        const trendingTopics = data.trending?.slice(0, 3) || [];
        const volume = data.volume || 0;
        const sentiment = data.sentiment || 'neutral';

        card.innerHTML = `
            <div class="trend-card-header">
                <i class="${iconClass} ${category}"></i>
                <div class="trend-card-title">
                    <h3>${displayName}</h3>
                    <p>${this.getCategoryDescription(category)}</p>
                </div>
            </div>
            
            <div class="trend-stats">
                <div class="trend-score">
                    <span>Trend Score</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${this.calculateScoreWidth(data)}%"></div>
                    </div>
                </div>
                <div class="volume-display">
                    <span class="volume-number">${volume}</span>
                    <span class="volume-label">mentions</span>
                </div>
            </div>
            
            <div class="trend-topics">
                ${trendingTopics.map(topic => `
                    <span class="topic-tag">${topic.topic}</span>
                `).join('')}
            </div>
        `;

        return card;
    }

    renderCategoryDetails(category, data) {
        // Update sentiment indicator
        const sentimentIndicator = document.getElementById('sentimentIndicator');
        sentimentIndicator.className = `sentiment-indicator ${data.sentiment}`;
        sentimentIndicator.innerHTML = `
            <i class="fas ${this.getSentimentIcon(data.sentiment)}"></i>
            <span>${this.capitalizeFirst(data.sentiment)}</span>
        `;

        // Update volume display
        const volumeDisplay = document.getElementById('volumeDisplay');
        volumeDisplay.innerHTML = `
            <span class="volume-number">${data.volume || 0}</span>
            <span class="volume-label">mentions</span>
        `;

        // Update sources list
        const sourcesList = document.getElementById('sourcesList');
        sourcesList.innerHTML = '';
        if (data.topSources && data.topSources.length > 0) {
            data.topSources.forEach(source => {
                const sourceItem = document.createElement('div');
                sourceItem.className = 'source-item';
                sourceItem.innerHTML = `
                    <span class="source-name">${source.source}</span>
                    <span class="source-count">${source.count}</span>
                `;
                sourcesList.appendChild(sourceItem);
            });
        } else {
            sourcesList.innerHTML = '<p>No source data available</p>';
        }

        // Update keywords cloud
        const keywordsCloud = document.getElementById('keywordsCloud');
        keywordsCloud.innerHTML = '';
        if (data.keywords && data.keywords.length > 0) {
            data.keywords.forEach(keyword => {
                const keywordTag = document.createElement('span');
                keywordTag.className = 'keyword-tag';
                keywordTag.textContent = keyword;
                keywordsCloud.appendChild(keywordTag);
            });
        } else {
            keywordsCloud.innerHTML = '<p>No keywords available</p>';
        }
    }

    updateTrends(data) {
        if (data.category && this.trendsData[data.category]) {
            this.trendsData[data.category] = data.trends;
            
            if (this.currentCategory === 'all') {
                this.renderDashboard(this.trendsData);
            } else if (this.currentCategory === data.category) {
                this.renderCategoryDetails(data.category, data.trends);
            }
            
            this.updateLastUpdated();
            
            // Also update raw posts when new data comes in
            this.updateRawPosts();
        }
    }

    // Raw Posts Management
    async refreshRawPosts() {
        try {
            this.showRawPostsLoading(true);
            const response = await fetch('/api/trends');
            const trends = await response.json();
            
            if (trends && Object.keys(trends).length > 0) {
                this.trendsData = trends;
                this.renderRawPosts(trends);
            } else {
                // If no real data, show sample data
                this.showSampleData();
            }
            
            this.showRawPostsLoading(false);
        } catch (error) {
            console.error('Failed to refresh raw posts:', error);
            this.showRawPostsLoading(false);
            this.showError('Failed to refresh posts, showing sample data instead');
            
            // Show sample data on error
            this.showSampleData();
        }
    }

    updateRawPosts() {
        if (this.trendsData && Object.keys(this.trendsData).length > 0) {
            this.renderRawPosts(this.trendsData);
        }
    }

    renderRawPosts(trends) {
        const container = document.getElementById('rawPostsContainer');
        if (!container) return;

        console.log('Rendering raw posts with data:', trends);
        console.log('Data structure:', Object.keys(trends).map(cat => ({
            category: cat,
            hasData: !!trends[cat],
            dataType: typeof trends[cat],
            isArray: Array.isArray(trends[cat]),
            length: Array.isArray(trends[cat]) ? trends[cat].length : 'N/A'
        })));

        container.innerHTML = '';

        let allPosts = [];
        
        // Collect all posts from all categories
        Object.entries(trends).forEach(([category, data]) => {
            console.log(`Processing category ${category}:`, data);
            
            // Handle the actual data structure from the scraper
            if (data && Array.isArray(data)) {
                // If data is an array of scraped sources
                data.forEach(source => {
                    console.log(`Processing source in ${category}:`, source);
                    if (source.articles && Array.isArray(source.articles)) {
                        source.articles.forEach(article => {
                            allPosts.push({
                                ...article,
                                category: category,
                                type: 'article',
                                source: source.source || 'Unknown'
                            });
                        });
                    }
                    
                    if (source.posts && Array.isArray(source.posts)) {
                        source.posts.forEach(post => {
                            allPosts.push({
                                ...post,
                                category: category,
                                type: 'post',
                                source: source.source || 'Unknown'
                            });
                        });
                    }
                });
            } else if (data && typeof data === 'object') {
                // Handle legacy data structure
                if (data.articles && Array.isArray(data.articles)) {
                    data.articles.forEach(article => {
                        allPosts.push({
                            ...article,
                            category: category,
                            type: 'article'
                        });
                    });
                }
                
                if (data.posts && Array.isArray(data.posts)) {
                    data.posts.forEach(post => {
                        allPosts.push({
                            ...post,
                            category: category,
                            type: 'post'
                        });
                    });
                }
            }
        });

        console.log('Total posts collected:', allPosts.length);

        // Sort by timestamp (newest first)
        allPosts.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.scrapedAt || Date.now());
            const dateB = new Date(b.timestamp || b.scrapedAt || Date.now());
            return dateB - dateA;
        });

        if (allPosts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-inbox"></i>
                    <p>No posts available yet. Try refreshing or wait for the next scrape cycle.</p>
                    <p style="font-size: 0.9rem; color: #999; margin-top: 0.5rem;">
                        Debug: Found ${Object.keys(trends).length} categories with data structure: ${JSON.stringify(Object.keys(trends).map(cat => ({category: cat, hasData: !!trends[cat], dataType: typeof trends[cat], isArray: Array.isArray(trends[cat])})), null, 2)}
                    </p>
                </div>
            `;
            return;
        }

        // Display posts
        allPosts.forEach(post => {
            const postElement = this.createRawPostElement(post);
            container.appendChild(postElement);
        });
    }

    createRawPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = `raw-post ${post.category}`;
        postDiv.dataset.category = post.category;
        postDiv.dataset.type = post.type;

        const timestamp = new Date(post.timestamp || post.scrapedAt || Date.now()).toLocaleString();
        const source = post.source || post.platform || 'Unknown';
        const title = post.title || post.content || 'No title';
        const content = post.content || post.title || 'No content available';

        postDiv.innerHTML = `
            <div class="raw-post-header">
                <div class="post-meta">
                    <span class="post-category">${post.category}</span>
                    <span class="post-source">${source}</span>
                    <span class="post-timestamp">${timestamp}</span>
                </div>
            </div>
            
            <div class="post-content">
                <div class="post-title">${this.escapeHtml(title)}</div>
                ${content !== title ? `<div class="post-text">${this.escapeHtml(content)}</div>` : ''}
            </div>
            
            <div class="post-footer">
                <span class="post-platform">${post.platform || post.type || 'web'}</span>
                <div class="post-actions">
                    <button class="post-action-btn" onclick="navigator.clipboard.writeText('${this.escapeHtml(title + '\n' + content)}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="post-action-btn" onclick="window.open('${post.url || '#'}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Open
                    </button>
                </div>
            </div>
        `;

        return postDiv;
    }

    filterRawPosts(category) {
        const posts = document.querySelectorAll('.raw-post');
        
        posts.forEach(post => {
            if (category === 'all' || post.dataset.category === category) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });

        // Show message if no posts match filter
        const visiblePosts = document.querySelectorAll('.raw-post[style*="block"]');
        const container = document.getElementById('rawPostsContainer');
        
        if (visiblePosts.length === 0 && category !== 'all') {
            const noMatchMessage = document.createElement('div');
            noMatchMessage.className = 'no-posts';
            noMatchMessage.innerHTML = `
                <i class="fas fa-filter"></i>
                <p>No posts found for ${category} category.</p>
            `;
            container.appendChild(noMatchMessage);
        }
    }

    showRawPostsLoading(show) {
        const container = document.getElementById('rawPostsContainer');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="loading-posts">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Refreshing posts...</p>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }

    getCategoryIcon(category) {
        const icons = {
            politics: 'fas fa-landmark',
            gaming: 'fas fa-gamepad',
            crypto: 'fas fa-bitcoin-sign',
            stocks: 'fas fa-chart-line',
            disasters: 'fas fa-exclamation-triangle',
            news: 'fas fa-newspaper'
        };
        return icons[category] || 'fas fa-globe';
    }

    getCategoryDisplayName(category) {
        const names = {
            politics: 'Politics',
            gaming: 'Gaming & Esports',
            crypto: 'Cryptocurrency',
            stocks: 'Stocks & Markets',
            disasters: 'Disasters & Emergencies',
            news: 'Breaking News'
        };
        return names[category] || 'Unknown';
    }

    getCategoryDescription(category) {
        const descriptions = {
            politics: 'Political developments and government updates',
            gaming: 'Latest in gaming, esports, and streaming',
            crypto: 'Cryptocurrency trends and blockchain news',
            stocks: 'Stock market updates and investment insights',
            disasters: 'Emergency alerts and disaster response',
            news: 'Breaking news and current events'
        };
        return descriptions[category] || 'Trending topics and updates';
    }

    getSentimentIcon(sentiment) {
        const icons = {
            positive: 'fa-smile',
            negative: 'fa-frown',
            neutral: 'fa-meh'
        };
        return icons[sentiment] || 'fa-meh';
    }

    calculateScoreWidth(data) {
        if (!data.trending || data.trending.length === 0) return 0;
        
        const maxScore = Math.max(...data.trending.map(t => t.score));
        return Math.min(maxScore, 100);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSettings() {
        // Create a settings modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1002;
            backdrop-filter: blur(10px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: rgba(10, 10, 10, 0.95);
            border: 2px solid #00d4ff;
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            backdrop-filter: blur(20px);
        `;

        // Get current theme from localStorage or default to dark
        const currentTheme = localStorage.getItem('vibeCheckSettings') ? 
            JSON.parse(localStorage.getItem('vibeCheckSettings')).theme || 'dark' : 'dark';
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="color: #00d4ff; font-size: 1.8rem; font-weight: 700; margin: 0;">⚙️ Settings</h2>
                <button id="closeSettings" style="background: none; border: none; color: #a0a0a0; font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">×</button>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffffff; font-size: 1.2rem; margin-bottom: 1rem;">Theme</h3>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <button class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark" style="padding: 0.75rem 1.5rem; ${currentTheme === 'dark' ? 'background: #00d4ff; color: white; border: none;' : 'background: rgba(255,255,255,0.1); color: #a0a0a0; border: 1px solid rgba(255,255,255,0.2);'} border-radius: 8px; cursor: pointer;">Dark</button>
                    <button class="theme-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme="light" style="padding: 0.75rem 1.5rem; ${currentTheme === 'light' ? 'background: #00d4ff; color: white; border: none;' : 'background: rgba(255,255,255,0.1); color: #a0a0a0; border: 1px solid rgba(255,255,255,0.2);'} border-radius: 8px; cursor: pointer;">Light</button>
                </div>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffffff; font-size: 1.2rem; margin-bottom: 1rem;">Refresh Interval</h3>
                <select id="refreshInterval" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; margin-bottom: 1rem;">
                    <option value="5">5 minutes</option>
                    <option value="15" selected>15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                </select>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffffff; font-size: 1.2rem; margin-bottom: 1rem;">Notifications</h3>
                <label style="display: flex; align-items: center; gap: 0.5rem; color: #a0a0a0; margin-bottom: 0.5rem;">
                    <input type="checkbox" id="enableNotifications" checked style="accent-color: #00d4ff;">
                    Enable push notifications
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; color: #a0a0a0;">
                    <input type="checkbox" id="enableSound" style="accent-color: #00d4ff;">
                    Enable sound alerts
                </label>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffffff; font-size: 1.2rem; margin-bottom: 1rem;">Web3 Settings</h3>
                <button id="connectWallet" style="width: 100%; padding: 1rem; background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; color: #00d4ff; font-weight: 600; cursor: pointer; margin-bottom: 1rem;">
                    Connect Wallet
                </button>
                <button id="disconnectWallet" style="width: 100%; padding: 1rem; background: rgba(255, 0, 128, 0.1); border: 1px solid rgba(255, 0, 128, 0.3); border-radius: 12px; color: #ff0080; font-weight: 600; cursor: pointer;">
                    Disconnect Wallet
                </button>
            </div>
            
            <div style="text-align: center;">
                <button id="saveSettings" style="padding: 1rem 2rem; background: linear-gradient(135deg, #00d4ff, #ff0080); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    Save Settings
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners - use arrow functions to preserve 'this' context
        const closeBtn = modal.querySelector('#closeSettings');
        const saveBtn = modal.querySelector('#saveSettings');
        const themeBtns = modal.querySelectorAll('.theme-btn');

        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        saveBtn.addEventListener('click', () => {
            this.saveSettings();
            modal.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Theme switching
        themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                themeBtns.forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.1)';
                    b.style.color = '#a0a0a0';
                    b.style.border = '1px solid rgba(255,255,255,0.2)';
                });
                
                // Add active class to clicked button
                e.target.style.background = '#00d4ff';
                e.target.style.color = 'white';
                e.target.style.border = 'none';
                
                // Store the selected theme
                e.target.dataset.active = 'true';
            });
        });
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('vibeCheckSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.applySettings(settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    applySettings(settings) {
        // Apply theme
        if (settings.theme) {
            this.applyTheme(settings.theme);
        }
        
        // Apply other settings as needed
        if (settings.refreshInterval) {
            // Could implement refresh interval changes here
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'light') {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--text-primary', '#1a1a1a');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--border-color', '#dee2e6');
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)');
            root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.95)');
            root.style.setProperty('--nav-bg', 'rgba(255, 255, 255, 0.9)');
        } else {
            root.style.setProperty('--bg-primary', '#0a0a0a');
            root.style.setProperty('--bg-secondary', '#1a1a2e');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a0a0a0');
            root.style.setProperty('--border-color', 'rgba(0, 212, 255, 0.2)');
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.03)');
            root.style.setProperty('--header-bg', 'rgba(10, 10, 10, 0.95)');
            root.style.setProperty('--nav-bg', 'rgba(10, 10, 10, 0.9)');
        }
    }

    saveSettings() {
        // Find the active theme button
        const activeThemeBtn = document.querySelector('.theme-btn[data-active="true"]');
        const selectedTheme = activeThemeBtn ? activeThemeBtn.dataset.theme : 'dark';
        
        const settings = {
            theme: selectedTheme,
            refreshInterval: document.getElementById('refreshInterval')?.value || '15',
            notifications: document.getElementById('enableNotifications')?.checked || false,
            sound: document.getElementById('enableSound')?.checked || false
        };
        
        localStorage.setItem('vibeCheckSettings', JSON.stringify(settings));
        
        // Apply theme immediately
        this.applyTheme(settings.theme);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            font-weight: 500;
        `;
        successDiv.textContent = 'Settings saved successfully!';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VibeCheckApp();
});

// Add some sample data for demonstration
window.sampleTrends = {
    politics: {
        trending: [
            { topic: 'election', frequency: 45, score: 85 },
            { topic: 'senate', frequency: 32, score: 72 },
            { topic: 'congress', frequency: 28, score: 65 }
        ],
        sentiment: 'neutral',
        volume: 156,
        topSources: [
            { source: 'rappler.com', count: 45 },
            { source: 'philstar.com', count: 38 },
            { source: 'inquirer.net', count: 32 }
        ],
        keywords: ['election', 'senate', 'congress', 'government', 'policy']
    },
    gaming: {
        trending: [
            { topic: 'mobile legends', frequency: 67, score: 92 },
            { topic: 'valorant', frequency: 43, score: 78 },
            { topic: 'esports', frequency: 38, score: 71 }
        ],
        sentiment: 'positive',
        volume: 234,
        topSources: [
            { source: 'ign.com', count: 67 },
            { source: 'gamespot.com', count: 52 },
            { source: 'polygon.com', count: 41 }
        ],
        keywords: ['mobile legends', 'valorant', 'esports', 'tournament', 'streaming']
    }
};
