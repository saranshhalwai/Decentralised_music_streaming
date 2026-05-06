"use client";

import { useState, useEffect } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getMarketplaceContract, getMusicNFTContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { ShoppingCart, Flame, Loader2 } from "lucide-react";

interface Listing {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  metadata?: any;
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
      
      const allListings = await marketplace.getAllActiveListings();
      setListings(allListings);
    } catch (e) {
      console.error("Error fetching listings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (listingId: bigint, price: bigint) => {
    try {
      const { signer } = await getWeb3Provider();
      const marketplace = getMarketplaceContract(signer);
      
      const fee = await marketplace.platformFeePercentage();
      const totalCost = price + (price * fee / 100n);

      const tx = await marketplace.buyNFT(listingId, { value: totalCost });
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
        <ShoppingCart className="w-10 h-10 text-[#ff2a5f]" />
        <div>
          <h1 className="text-4xl font-black">NFT Marketplace</h1>
          <p className="text-gray-400">Collect exclusive tracks and support artists directly.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#ff2a5f]" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-[#2a2a2a] rounded-3xl">
          <h2 className="text-xl font-bold text-gray-300">No active listings</h2>
          <p className="text-gray-500 text-sm mt-2">Check back later for new exclusive tracks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {listings.map(l => (
            <div key={l.listingId.toString()} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 group hover:border-[#ff2a5f]/50 transition-colors">
              <div className="aspect-square bg-gradient-to-tr from-[#1a1a1a] to-[#0d0d0d] rounded-xl mb-4 flex items-center justify-center border border-white/5 relative overflow-hidden">
                <Flame className="w-12 h-12 text-[#ff2a5f]/20 group-hover:text-[#ff2a5f]/40 transition-colors" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     onClick={() => handleBuy(l.listingId, l.price)}
                     className="px-6 py-2 bg-[#ff2a5f] text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                   >
                     Buy Now
                   </button>
                </div>
              </div>
              <h3 className="font-bold text-lg">Token #{l.tokenId.toString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500 text-sm">Price</span>
                <span className="text-white font-bold">{ethers.formatEther(l.price)} ETH</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500 flex justify-between">
                <span>Seller</span>
                <span className="text-[#ff2a5f]">{l.seller.substring(0,6)}...{l.seller.substring(l.seller.length-4)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
