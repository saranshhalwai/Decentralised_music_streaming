"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Tag, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getWeb3Provider, formatAddress } from "@/lib/web3";
import { getMusicNFTMarketplaceContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { EthersError } from "@/types/global.d";

interface MarketItem {
  tokenId: string;
  seller: string;
  price: string;
  isSold: boolean;
  currentlyListed: boolean;
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [view, setView] = useState<'buy' | 'owned'>('buy');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { provider } = await getWeb3Provider();
      const marketplace = getMusicNFTMarketplaceContract(provider);
      
      let rawItems: any[];
      if (view === 'buy') {
        rawItems = await marketplace.getAllUnsoldTokens();
      } else {
        rawItems = await marketplace.getMyTokens();
      }
      
      const formattedItems: MarketItem[] = rawItems.map((item: any) => ({
        tokenId: item.tokenId.toString(),
        seller: item.seller,
        price: ethers.formatEther(item.price),
        isSold: !item.currentlyListed,
        currentlyListed: item.currentlyListed
      }));
      
      setItems(formattedItems);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const buyToken = async (item: MarketItem) => {
    try {
      setBuyingId(item.tokenId);
      setTxStatus(null);
      const { signer } = await getWeb3Provider();
      const marketplace = getMusicNFTMarketplaceContract(signer);
      
      const price = ethers.parseEther(item.price);
      const tx = await marketplace.buyToken(BigInt(item.tokenId), { value: price });
      
      setTxStatus({ type: 'success', message: 'Purchase transaction sent! Waiting for confirmation...' });
      await tx.wait();
      setTxStatus({ type: 'success', message: `Successfully bought Token #${item.tokenId}! It is now in your collection.` });
      
      fetchItems();
    } catch (err: unknown) {
      const error = err as EthersError;
      if (error.code !== "ACTION_REJECTED") {
        setTxStatus({ type: 'error', message: error.message || 'Purchase failed.' });
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3 mb-2">
            <ShoppingBag className="text-[#ff2a5f] w-8 h-8" />
            NFT Marketplace
          </h1>
          <p className="text-gray-400">Exclusive music collectibles from your favorite artists.</p>
        </div>
        
        <div className="flex bg-[#141414] p-1 rounded-xl border border-[#2a2a2a]">
          <button 
            onClick={() => setView('buy')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'buy' ? 'bg-[#ff2a5f] text-white shadow-lg shadow-[#ff2a5f]/20' : 'text-gray-400 hover:text-white'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setView('owned')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'owned' ? 'bg-[#ff2a5f] text-white shadow-lg shadow-[#ff2a5f]/20' : 'text-gray-400 hover:text-white'}`}
          >
            My Collection
          </button>
        </div>
      </div>

      {txStatus && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border shadow-lg ${
          txStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {txStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{txStatus.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-[#ff2a5f] animate-spin" />
          <p className="text-gray-500">Syncing with blockchain...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.tokenId} className="group relative rounded-2xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#ff2a5f]/50 transition-all duration-300">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-[#ff2a5f]/10 rounded-full flex items-center justify-center">
                    <Tag className="w-10 h-10 text-[#ff2a5f]" />
                  </div>
                  <span className="text-2xl font-black text-white">#{item.tokenId}</span>
                </div>
                {item.currentlyListed && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#ff7e40] border border-white/10">
                    {item.price} ETH
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">BeatChain Collectible</h3>
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {item.currentlyListed ? `Seller: ${formatAddress(item.seller)}` : "Owned by you"}
                    </p>
                  </div>
                </div>
                
                {view === 'buy' ? (
                  <button 
                    disabled={buyingId !== null}
                    onClick={() => buyToken(item)}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {buyingId === item.tokenId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Buy Now
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-xl bg-[#1f1f1f] text-gray-400 font-bold text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    In Collection
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-3xl">
          <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-300">No items found</h3>
          <p className="text-gray-500 max-w-xs mx-auto text-sm mt-2">
            {view === 'buy' 
              ? "All tokens have been sold out! Check back later for new drops." 
              : "You haven't collected any NFTs yet. Explore the marketplace to find your first piece."}
          </p>
        </div>
      )}
    </div>
  );
}
