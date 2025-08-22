class VibeCheckApp {
    constructor() {
        this.socket = null;
        this.currentCategory = 'all';
        this.trendsData = {};
        this.init();
    }

    init() {
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

        // Trend card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.trend-card')) {
                const category = e.target.closest('.trend-card').dataset.category;
                this.showCategoryDetails(category);
            }
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
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load trends data');
        } finally {
            this.showLoading(false);
        }
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
        }
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
