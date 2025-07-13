import { ethers } from 'hardhat';
import hre from 'hardhat';

async function main() {
  console.log('🚀 Starting deployment to Arbitrum Sepolia...\n');

  // Get the network details
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Minimum balance check (0.01 ETH)
  const minimumBalance = ethers.parseEther('0.01');
  if (balance < minimumBalance) {
    console.error(
      '❌ Insufficient balance for deployment. Need at least 0.01 ETH'
    );
    process.exit(1);
  }

  console.log('📄 Deploying Mentora contract...');

  // Deploy the contract
  const Mentora = await ethers.getContractFactory('Mentora');
  const mentora = await Mentora.deploy();

  console.log('⏳ Waiting for deployment transaction...');
  await mentora.waitForDeployment();

  const contractAddress = await mentora.getAddress();
  console.log(`✅ Mentora deployed to: ${contractAddress}\n`);

  // Wait for a few block confirmations before verifying
  console.log('⏳ Waiting for block confirmations...');
  await mentora.deploymentTransaction()?.wait(6);

  // Try to verify the contract
  console.log('🔍 Verifying contract on Arbiscan...');
  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log('✅ Contract verified successfully!');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ Contract is already verified!');
    } else {
      console.log('⚠️  Verification failed:', error.message);
      console.log('You can verify manually later using:');
      console.log(
        `npx hardhat verify --network arbitrumSepolia ${contractAddress}`
      );
    }
  }

  // Display deployment summary
  console.log('\n📋 Deployment Summary:');
  console.log('========================');
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: Arbitrum Sepolia`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Block Explorer: https://sepolia.arbiscan.io/address/${contractAddress}`
  );

  // Save deployment info to file
  const deploymentInfo = {
    contractName: 'Mentora',
    contractAddress: contractAddress,
    network: 'arbitrumSepolia',
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    blockExplorer: `https://sepolia.arbiscan.io/address/${contractAddress}`,
  };

  const fs = require('fs');
  const path = require('path');

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, 'arbitrum-sepolia.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log('\n🎉 Deployment completed successfully!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});
