import { BrowserProvider } from "ethers";
import { EthersError } from "@/types/global.d";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

export const getWeb3Provider = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }

  // Request accounts
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Check and switch network if necessary
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  
  if (currentChainId !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err: unknown) {
      const switchError = err as EthersError;
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "SEP",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch {
          throw new Error("Could not add Sepolia network to MetaMask");
        }
      } else {
        throw new Error("Please switch to the Sepolia network in MetaMask");
      }
    }
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return { provider, signer };
};

export const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
