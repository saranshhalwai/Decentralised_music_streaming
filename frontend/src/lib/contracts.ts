import { Contract, Signer, Provider } from 'ethers';
import MusicRegistry from './abis/MusicRegistry.json';
import Payment from './abis/Payment.json';
import MusicNFT from './abis/MusicNFT.json';
import DisputeResolution from './abis/DisputeResolution.json';
import SharedOwnership from './abis/SharedOwnership.json';
import Marketplace from './abis/MusicMarketplace.json';
import BeatToken from './abis/BeatToken.json';

export const MUSIC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000";
export const PAYMENT_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MUSIC_NFT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const DISPUTE_RESOLUTION_ADDRESS = process.env.NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS || "0x0000000000000000000000000000000000000000";
export const SHARED_OWNERSHIP_ADDRESS   = process.env.NEXT_PUBLIC_SHARED_OWNERSHIP_ADDRESS   || "0x0000000000000000000000000000000000000000";
export const MARKETPLACE_ADDRESS         = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS         || "0x0000000000000000000000000000000000000000";
export const GOVERNANCE_TOKEN_ADDRESS    = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS    || "0x0000000000000000000000000000000000000000";

export const MusicRegistryABI = MusicRegistry.abi;
export const PaymentABI = Payment.abi;
export const MusicNFTABI = MusicNFT.abi;
export const DisputeResolutionABI = DisputeResolution.abi;
export const SharedOwnershipABI = SharedOwnership.abi;
export const MarketplaceABI = Marketplace.abi;
export const BeatTokenABI = BeatToken.abi;

export const getMusicRegistryContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(MUSIC_REGISTRY_ADDRESS, MusicRegistryABI, signerOrProvider);
};

export const getPaymentContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(PAYMENT_ADDRESS, PaymentABI, signerOrProvider);
};

export const getMusicNFTContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(MUSIC_NFT_ADDRESS, MusicNFTABI, signerOrProvider);
};

export const getDisputeResolutionContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(DISPUTE_RESOLUTION_ADDRESS, DisputeResolutionABI, signerOrProvider);
};

export const getSharedOwnershipContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(SHARED_OWNERSHIP_ADDRESS, SharedOwnershipABI, signerOrProvider);
};

export const getMarketplaceContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signerOrProvider);
};

export const getGovernanceTokenContract = (signerOrProvider: Signer | Provider) => {
  return new Contract(GOVERNANCE_TOKEN_ADDRESS, BeatTokenABI, signerOrProvider);
};
