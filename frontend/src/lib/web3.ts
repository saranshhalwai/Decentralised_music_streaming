import { BrowserProvider, JsonRpcSigner, ethers } from "ethers";

export const getWeb3Provider = async () => {
  if (typeof window === "undefined") {
    throw new Error("MetaMask is not installed!");
  }
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error("MetaMask is not installed!");
  }

  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  
  return { provider, signer };
};

export const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
