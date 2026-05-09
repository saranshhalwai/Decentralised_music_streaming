import { BrowserProvider, JsonRpcProvider } from "ethers";
import { EthersError } from "@/types/global.d";

const TARGET_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
const TARGET_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "0xaa36a7"; // Sepolia by default

// Human-readable chain names for the switch prompt message
const CHAIN_NAMES: Record<string, string> = {
  "0xaa36a7": "Sepolia Testnet",
  "0x1":      "Ethereum Mainnet",
  "0x7a69":   "Hardhat Localhost",
};

// Chain metadata for wallet_addEthereumChain
const CHAIN_METADATA: Record<string, object> = {
  "0xaa36a7": {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org", "https://eth-sepolia.public.blastapi.io"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  "0x7a69": {
    chainId: "0x7a69",
    chainName: "Hardhat Localhost",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: [TARGET_RPC_URL],
  },
};

export const getReadOnlyProvider = () => {
  return new JsonRpcProvider(TARGET_RPC_URL);
};

// Prevent concurrent MetaMask switch requests ("already pending" error)
let isSwitchingChain = false;

export const getWeb3Provider = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install it from metamask.io");
  }

  // Request account access
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Check current chain and switch if needed
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

  if (currentChainId !== TARGET_CHAIN_ID) {
    const chainName = CHAIN_NAMES[TARGET_CHAIN_ID] ?? TARGET_CHAIN_ID;

    if (isSwitchingChain) {
      throw new Error(
        `MetaMask is already showing a network switch prompt. Please open MetaMask and accept it, then try again.`
      );
    }

    isSwitchingChain = true;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
    } catch (err: unknown) {
      const switchError = err as EthersError;
      const msg = switchError.message ?? "";

      if (switchError.code === 4902) {
        // Chain not yet in MetaMask → add it
        const meta = CHAIN_METADATA[TARGET_CHAIN_ID];
        if (!meta) {
          throw new Error(`Please add ${chainName} to MetaMask manually and try again.`);
        }
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [meta],
          });
        } catch {
          throw new Error(`Could not add ${chainName} to MetaMask. Please add it manually.`);
        }
      } else if (switchError.code === 4001 || (switchError as { code?: string }).code === "ACTION_REJECTED") {
        throw new Error(`You must switch to ${chainName} in MetaMask to continue.`);
      } else if (msg.includes("already pending")) {
        throw new Error(
          `MetaMask already has a pending network request. Open MetaMask, approve or reject it, then try again.`
        );
      } else {
        throw new Error(`Failed to switch to ${chainName}: ${msg || String(switchError)}`);
      }
    } finally {
      isSwitchingChain = false;
    }
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return { provider, signer };
};

export const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
