"use client";

import { useState, useEffect } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getMarketplaceContract, getMusicNFTContract, getMusicRegistryContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { ShoppingCart, Flame, Loader2, Tag, User } from "lucide-react";
import { getIPFSUrl } from "@/lib/ipfs";
import Image from "next/image";

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  trackTitle?: string;
  coverUrl?: string;
  artistName?: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const provider = getReadOnlyProvider();
      const marketplace = getMarketplaceContract(provider);
      const nftContract = getMusicNFTContract(provider);
      const registry = getMusicRegistryContract(provider);
      
      const activeTokenIds = await marketplace.getActiveListings();
      const loadedListings: Listing[] = [];

      for (const tokenId of activeTokenIds) {
        try {
          const listing = await marketplace.getListing(tokenId);
          const nftData = await nftContract.getCollectible(tokenId);
          const track = await registry.getTrack(nftData.trackId);
          
          loadedListings.push({
            tokenId: listing.tokenId,
            seller: listing.seller,
            price: listing.price,
            active: listing.active,
            trackTitle: track.title,
            artistName: track.artistName,
            coverUrl: getIPFSUrl(track.coverArtCID)
          });
        } catch (e) {
          console.error(`Error loading details for token ${tokenId}`, e);
        }
      }

      setListings(loadedListings);
    } catch (e) {
      console.error("Error fetching listings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (tokenId: bigint, price: bigint) => {
    try {
      const { signer } = await getWeb3Provider();
      const marketplace = getMarketplaceContract(signer);
      
      // Calculate total cost (price + fee)
      // Note: In your contract, the seller receives (price - fee). 
      // The buyer pays exactly 'price'. 
      // Let's re-verify contract: buyNFT requires msg.value == listing.price.
      
      const tx = await marketplace.buyNFT(tokenId, { value: price });
      alert("Purchase transaction sent. Waiting for confirmation...");
      await tx.wait();
      alert("Successfully purchased NFT!");
      fetchListings();
    } catch (e) {
      console.error(e);
      alert("Failed to buy NFT.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-[#ff2a5f]/20 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-[#ff2a5f]" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">NFT Marketplace</h1>
          <p className="text-gray-400">Collect exclusive tracks and support artists directly.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#ff2a5f]" />
          <p className="text-gray-500 animate-pulse font-medium">Scanning the blockchain for listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-32 bg-[#141414] border border-[#2a2a2a] rounded-3xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <Tag className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-300">No active listings</h2>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">Be the first to list an exclusive track or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.map(l => (
            <div key={l.tokenId.toString()} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden group hover:border-[#ff2a5f]/50 transition-all duration-300 flex flex-col shadow-xl">
              <div className="aspect-square relative overflow-hidden">
                <Image 
                  src={l.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop"} 
                  alt="NFT" 
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center px-6">
                   <button 
                     onClick={() => handleBuy(l.tokenId, l.price)}
                     className="w-full py-3 bg-[#ff2a5f] text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                   >
                     <ShoppingCart className="w-4 h-4" />
                     Buy for {ethers.formatEther(l.price)} ETH
                   </button>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                   <Flame className="w-3.5 h-3.5 text-[#ff7e40]" />
                   <span className="text-white text-[10px] font-black uppercase tracking-wider">Exclusive</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-white line-clamp-1">{l.trackTitle}</h3>
                  <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5" />
                    {l.artistName}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Price</span>
                    <span className="text-white font-black">{ethers.formatEther(l.price)} ETH</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Token ID</span>
                    <p className="text-[#ff2a5f] font-mono text-xs">#{l.tokenId.toString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
