import { ethers } from 'hardhat';
import hre from 'hardhat';

async function main() {
  console.log(
    '🚀 Starting deployment of additional contracts to Arbitrum Sepolia...\n'
  );

  // Get the network details
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Minimum balance check (0.05 ETH for multiple contracts)
  const minimumBalance = ethers.parseEther('0.05');
  if (balance < minimumBalance) {
    console.error(
      '❌ Insufficient balance for deployment. Need at least 0.05 ETH'
    );
    process.exit(1);
  }

  // Contract addresses object to store deployed addresses
  const deployedContracts: {
    [key: string]: string;
  } = {};

  // PHASE 1: Deploy contracts with no dependencies
  console.log('📄 Phase 1: Deploying contracts with no dependencies...\n');

  // Deploy Mentors contract
  console.log('📄 Deploying Mentors contract...');
  const Mentors = await ethers.getContractFactory('Mentors');
  const mentors = await Mentors.deploy();
  await mentors.waitForDeployment();
  deployedContracts.mentors = await mentors.getAddress();
  console.log(`✅ Mentors deployed to: ${deployedContracts.mentors}`);

  // Deploy MockERC20 contract
  console.log('📄 Deploying MockERC20 contract...');
  const MockERC20 = await ethers.getContractFactory('MockERC20');
  const mockERC20 = await MockERC20.deploy(
    'Mentora Token', // name
    'MNT', // symbol
    18, // decimals
    ethers.parseEther('1000000') // initial supply: 1,000,000 tokens
  );
  await mockERC20.waitForDeployment();
  deployedContracts.mockERC20 = await mockERC20.getAddress();
  console.log(`✅ MockERC20 deployed to: ${deployedContracts.mockERC20}`);

  // Deploy Participants contract
  console.log('📄 Deploying Participants contract...');
  const Participants = await ethers.getContractFactory('Participants');
  const participants = await Participants.deploy();
  await participants.waitForDeployment();
  deployedContracts.participants = await participants.getAddress();
  console.log(`✅ Participants deployed to: ${deployedContracts.participants}`);

  // PHASE 2: Deploy contracts with dependencies
  console.log('\n📄 Phase 2: Deploying contracts with dependencies...\n');

  // Deploy Sessions contract (requires Mentors and MockERC20 addresses)
  console.log('📄 Deploying Sessions contract...');
  const Sessions = await ethers.getContractFactory('Sessions');
  const sessions = await Sessions.deploy(
    deployedContracts.mentors, // Mentors contract address
    deployedContracts.mockERC20, // ERC20 token address
    500 // fee in basis points (5% = 500/10000)
  );
  await sessions.waitForDeployment();
  deployedContracts.sessions = await sessions.getAddress();
  console.log(`✅ Sessions deployed to: ${deployedContracts.sessions}`);

  console.log('\n⏳ Waiting for block confirmations...');
  // Wait for confirmations for all contracts
  await Promise.all([
    mentors.deploymentTransaction()?.wait(6),
    mockERC20.deploymentTransaction()?.wait(6),
    participants.deploymentTransaction()?.wait(6),
    sessions.deploymentTransaction()?.wait(6),
  ]);

  // PHASE 3: Contract verification
  console.log('\n🔍 Verifying contracts on Arbiscan...');

  const verifyContract = async (
    contractName: string,
    address: string,
    constructorArguments: any[]
  ) => {
    try {
      await hre.run('verify:verify', {
        address: address,
        constructorArguments: constructorArguments,
      });
      console.log(`✅ ${contractName} verified successfully!`);
    } catch (error: any) {
      if (error.message.includes('Already Verified')) {
        console.log(`✅ ${contractName} is already verified!`);
      } else {
        console.log(`⚠️  ${contractName} verification failed:`, error.message);
        console.log(
          `Manual verification command: npx hardhat verify --network arbitrumSepolia ${address}`
        );
      }
    }
  };

  await verifyContract('Mentors', deployedContracts.mentors, []);
  await verifyContract('MockERC20', deployedContracts.mockERC20, [
    'Mentora Token',
    'MNT',
    18,
    ethers.parseEther('1000000').toString(),
  ]);
  await verifyContract('Participants', deployedContracts.participants, []);
  await verifyContract('Sessions', deployedContracts.sessions, [
    deployedContracts.mentors,
    deployedContracts.mockERC20,
    500,
  ]);

  // Display deployment summary
  console.log('\n📋 Deployment Summary:');
  console.log('========================');
  console.log(`Mentors Contract: ${deployedContracts.mentors}`);
  console.log(`MockERC20 Contract: ${deployedContracts.mockERC20}`);
  console.log(`Participants Contract: ${deployedContracts.participants}`);
  console.log(`Sessions Contract: ${deployedContracts.sessions}`);
  console.log(`Network: Arbitrum Sepolia`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log('\nBlock Explorers:');
  console.log(
    `Mentors: https://sepolia.arbiscan.io/address/${deployedContracts.mentors}`
  );
  console.log(
    `MockERC20: https://sepolia.arbiscan.io/address/${deployedContracts.mockERC20}`
  );
  console.log(
    `Participants: https://sepolia.arbiscan.io/address/${deployedContracts.participants}`
  );
  console.log(
    `Sessions: https://sepolia.arbiscan.io/address/${deployedContracts.sessions}`
  );

  // Save deployment info to file
  const deploymentInfo = {
    network: 'arbitrumSepolia',
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    contracts: {
      mentors: {
        name: 'Mentors',
        address: deployedContracts.mentors,
        constructorArgs: [],
        blockExplorer: `https://sepolia.arbiscan.io/address/${deployedContracts.mentors}`,
      },
      mockERC20: {
        name: 'MockERC20',
        address: deployedContracts.mockERC20,
        constructorArgs: [
          'Mentora Token',
          'MNT',
          18,
          ethers.parseEther('1000000').toString(),
        ],
        blockExplorer: `https://sepolia.arbiscan.io/address/${deployedContracts.mockERC20}`,
      },
      participants: {
        name: 'Participants',
        address: deployedContracts.participants,
        constructorArgs: [],
        blockExplorer: `https://sepolia.arbiscan.io/address/${deployedContracts.participants}`,
      },
      sessions: {
        name: 'Sessions',
        address: deployedContracts.sessions,
        constructorArgs: [
          deployedContracts.mentors,
          deployedContracts.mockERC20,
          500,
        ],
        blockExplorer: `https://sepolia.arbiscan.io/address/${deployedContracts.sessions}`,
      },
    },
  };

  const fs = require('fs');
  const path = require('path');

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(
    deploymentsDir,
    'additional-contracts-arbitrum-sepolia.json'
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log('\n🎉 All contracts deployed successfully!');
  console.log('\n📝 Contract Dependencies:');
  console.log('- Mentors: Independent contract');
  console.log('- MockERC20: Independent contract');
  console.log('- Participants: Independent contract');
  console.log('- Sessions: Depends on Mentors and MockERC20');
  console.log('\n💡 Next steps:');
  console.log('1. Test the contracts using the deployed addresses');
  console.log('2. Set up initial mentors using the Mentors contract');
  console.log('3. Mint tokens to users using the MockERC20 contract');
  console.log('4. Configure any additional settings as needed');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});
