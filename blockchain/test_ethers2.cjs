const { Contract, JsonRpcProvider, Wallet } = require("ethers");
const fs = require("fs");

const abiData = JSON.parse(fs.readFileSync("../frontend/src/lib/abis/MusicRegistry.json", "utf8"));
const abi = abiData.abi;

async function test() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const registry = new Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", abi, signer);
  const tx = await registry.uploadTrack("test", "test", "test", undefined, undefined);
  console.log("Tx hash:", tx.hash);
}
test().catch(console.error);
