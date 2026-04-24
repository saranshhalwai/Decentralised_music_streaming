import { Contract, Signer, Provider } from 'ethers';
import MusicRegistry from './abis/MusicRegistry.json';
import Payment from './abis/Payment.json';
import MusicNFT from './abis/MusicNFT.json';

export const MUSIC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000";
export const PAYMENT_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MUSIC_NFT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const MusicRegistryABI = MusicRegistry.abi;
export const PaymentABI = Payment.abi;
export const MusicNFTABI = MusicNFT.abi;

export const getMusicRegistryContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(MUSIC_REGISTRY_ADDRESS, MusicRegistryABI, signerOrProvider);
};

export const getPaymentContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(PAYMENT_ADDRESS, PaymentABI, signerOrProvider);
};

export const getMusicNFTContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(MUSIC_NFT_ADDRESS, MusicNFTABI, signerOrProvider);
};
