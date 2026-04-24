import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  
  console.log("🚀 Deploying contracts to", network.name, "...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ------------------------------------------------------------------
  // 1. MusicRegistry
  // ------------------------------------------------------------------
  console.log("Deploying MusicRegistry...");
  const MusicRegistry = await ethers.getContractFactory("MusicRegistry");
  const musicRegistry = await MusicRegistry.deploy();
  await musicRegistry.waitForDeployment();
  const registryAddress = await musicRegistry.getAddress();
  console.log("✅ MusicRegistry deployed to:", registryAddress);

  // ------------------------------------------------------------------
  // 2. Payment
  // ------------------------------------------------------------------
  console.log("\nDeploying Payment...");
  const Payment = await ethers.getContractFactory("Payment");
  const payment = await Payment.deploy(registryAddress);
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();
  console.log("✅ Payment deployed to:", paymentAddress);

  // ------------------------------------------------------------------
  // 3. MusicNFT
  // ------------------------------------------------------------------
  console.log("\nDeploying MusicNFT...");
  const MusicNFT = await ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFT.deploy(registryAddress);
  await musicNFT.waitForDeployment();
  const nftAddress = await musicNFT.getAddress();
  console.log("✅ MusicNFT deployed to:", nftAddress);

  // ------------------------------------------------------------------
  // 4. MusicNFTMarketplace
  // ------------------------------------------------------------------
  console.log("\nDeploying MusicNFTMarketplace...");
  const MusicNFTMarketplace = await ethers.getContractFactory("MusicNFTMarketplace");
  
  const royaltyFee = ethers.parseEther("0.0001");
  const artistAddress = deployer.address;
  const prices = [
    ethers.parseEther("0.01"),
    ethers.parseEther("0.02"),
    ethers.parseEther("0.03"),
    ethers.parseEther("0.04"),
    ethers.parseEther("0.05"),
    ethers.parseEther("0.06"),
    ethers.parseEther("0.07"),
    ethers.parseEther("0.08")
  ];
  
  const totalValue = royaltyFee * BigInt(prices.length);

  const musicNFTMarketplace = await MusicNFTMarketplace.deploy(
    royaltyFee,
    artistAddress,
    prices,
    { value: totalValue }
  );
  await musicNFTMarketplace.waitForDeployment();
  const marketplaceAddress = await musicNFTMarketplace.getAddress();
  console.log("✅ MusicNFTMarketplace deployed to:", marketplaceAddress);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log("\n========================================");
  console.log("📋 Deployment Summary");
  console.log("========================================");
  console.log(`Network:              ${network.name}`);
  console.log(`MusicRegistry:        ${registryAddress}`);
  console.log(`Payment:              ${paymentAddress}`);
  console.log(`MusicNFT:             ${nftAddress}`);
  console.log(`MusicNFTMarketplace:  ${marketplaceAddress}`);
  console.log("========================================");
  console.log("\n⚠️  Save these addresses! Update your frontend .env with them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
