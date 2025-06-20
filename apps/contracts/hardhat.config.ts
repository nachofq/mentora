import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the specific contracts env file
dotenv.config({ path: path.resolve(__dirname, '../../envs/.env.contracts') });

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    hardhat: {
      // Optional: customize the hardhat network
      // chainId: 31337, // Default chain ID for hardhat network
      // gas: 12000000,
      // blockGasLimit: 12000000,
    },
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      accounts: process.env.ACCOUNT_PK_ARB ? [process.env.ACCOUNT_PK_ARB] : [],
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      accounts: process.env.ACCOUNT_PK_ARB_SEPOLIA
        ? [process.env.ACCOUNT_PK_ARB_SEPOLIA]
        : [],
    },
  },
};

export default config;
