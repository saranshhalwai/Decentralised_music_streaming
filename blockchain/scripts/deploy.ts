import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying contracts to", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ------------------------------------------------------------------
  // 1. MusicRegistry
  // ------------------------------------------------------------------
  console.log("Deploying MusicRegistry...");
  const MusicRegistry = await hre.ethers.getContractFactory("MusicRegistry");
  const musicRegistry = await MusicRegistry.deploy();
  await musicRegistry.waitForDeployment();
  const registryAddress = await musicRegistry.getAddress();
  console.log("✅ MusicRegistry deployed to:", registryAddress);

  // ------------------------------------------------------------------
  // 2. Payment
  // ------------------------------------------------------------------
  console.log("\nDeploying Payment...");
  const Payment = await hre.ethers.getContractFactory("Payment");
  const payment = await Payment.deploy(registryAddress);
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();
  console.log("✅ Payment deployed to:", paymentAddress);

  // ------------------------------------------------------------------
  // 3. MusicNFT
  // ------------------------------------------------------------------
  console.log("\nDeploying MusicNFT...");
  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFT.deploy(registryAddress);
  await musicNFT.waitForDeployment();
  const nftAddress = await musicNFT.getAddress();
  console.log("✅ MusicNFT deployed to:", nftAddress);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log("\n========================================");
  console.log("📋 Deployment Summary");
  console.log("========================================");
  console.log(`Network:        ${hre.network.name}`);
  console.log(`MusicRegistry:  ${registryAddress}`);
  console.log(`Payment:        ${paymentAddress}`);
  console.log(`MusicNFT:       ${nftAddress}`);
  console.log("========================================");
  console.log("\n⚠️  Save these addresses! Update your frontend .env with them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
