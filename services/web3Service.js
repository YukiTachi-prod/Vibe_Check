import { ethers } from 'ethers';

export class Web3Service {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.wallet = null;
    this.contracts = {};
    this.currentRpcIndex = 0;
  }

  async initialize() {
    try {
      // Try the primary RPC endpoint first
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // Test the connection
      await this.provider.getBlockNumber();
      console.log('Web3 service initialized successfully with primary endpoint');
      return true;
    } catch (error) {
      console.log('Primary RPC endpoint failed, trying fallbacks...');
      return await this.tryFallbackEndpoints();
    }
  }

  async tryFallbackEndpoints() {
    if (!this.config.fallbackRpcUrls || this.config.fallbackRpcUrls.length === 0) {
      console.error('No fallback RPC endpoints available');
      return false;
    }

    for (let i = 0; i < this.config.fallbackRpcUrls.length; i++) {
      try {
        const fallbackUrl = this.config.fallbackRpcUrls[i];
        console.log(`Trying fallback endpoint: ${fallbackUrl}`);
        
        this.provider = new ethers.JsonRpcProvider(fallbackUrl);
        
        // Test the connection
        await this.provider.getBlockNumber();
        this.currentRpcIndex = i + 1;
        console.log(`Web3 service initialized successfully with fallback endpoint ${i + 1}`);
        return true;
      } catch (error) {
        console.log(`Fallback endpoint ${i + 1} failed: ${error.message}`);
        continue;
      }
    }

    console.error('All RPC endpoints failed');
    return false;
  }

  async getNetworkStatus() {
    if (!this.provider) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          connected: false,
          error: 'Failed to connect to any Base Sepolia RPC endpoint',
          timestamp: new Date().toISOString()
        };
      }
    }

    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      const gasPrice = await this.provider.getFeeData();

      return {
        connected: true,
        network: {
          name: network.name || 'Base Sepolia',
          chainId: network.chainId.toString(),
          blockNumber: blockNumber.toString()
        },
        gasPrice: {
          gasPrice: gasPrice.gasPrice?.toString() || '0',
          maxFeePerGas: gasPrice.maxFeePerGas?.toString() || '0',
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString() || '0'
        },
        endpoint: this.currentRpcIndex === 0 ? 'Primary' : `Fallback ${this.currentRpcIndex}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // If current provider fails, try to reinitialize
      console.log('Current provider failed, attempting to reinitialize...');
      this.provider = null;
      const reinitialized = await this.initialize();
      
      if (reinitialized) {
        return await this.getNetworkStatus();
      }

      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async createWallet() {
    try {
      this.wallet = ethers.Wallet.createRandom();
      return {
        address: this.wallet.address,
        privateKey: this.wallet.privateKey,
        mnemonic: this.wallet.mnemonic?.phrase
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  async getBalance(address) {
    if (!this.provider) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to connect to Base network');
      }
    }

    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async sendTransaction(to, amount, privateKey) {
    if (!this.provider) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to connect to Base network');
      }
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const tx = await wallet.sendTransaction({
        to: to,
        value: ethers.parseEther(amount.toString())
      });

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice?.toString() || '0'
      };
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  async getTransactionReceipt(hash) {
    if (!this.provider) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to connect to Base network');
      }
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(hash);
      return receipt;
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  getCurrentEndpoint() {
    if (this.currentRpcIndex === 0) {
      return this.config.rpcUrl;
    } else if (this.config.fallbackRpcUrls && this.config.fallbackRpcUrls[this.currentRpcIndex - 1]) {
      return this.config.fallbackRpcUrls[this.currentRpcIndex - 1];
    }
    return 'Unknown';
  }
}
