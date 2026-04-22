import MusicRegistry from './abis/MusicRegistry.json';
import Payment from './abis/Payment.json';
import MusicNFT from './abis/MusicNFT.json';

// These addresses should be updated after deployment
export const MUSIC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000";
export const PAYMENT_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MUSIC_NFT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const MusicRegistryABI = MusicRegistry.abi;
export const PaymentABI = Payment.abi;
export const MusicNFTABI = MusicNFT.abi;
