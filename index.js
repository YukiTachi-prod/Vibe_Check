import { ethers } from 'ethers';
import { config } from './config.js';

async function main() {
  // Create a provider instance to connect to the Base network
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  try {
    // Get the current block number
    const blockNumber = await provider.getBlockNumber();
    console.log('Successfully connected to the Base network!');
    console.log('Current block number:', blockNumber);

    // Get the network details
    const network = await provider.getNetwork();
    console.log('Network name:', network.name);
    console.log('Network chain ID:', network.chainId);

  } catch (error) {
    console.error('Failed to connect to the Base network:', error);
  }
}

main();