"use client";

import { useEffect, useState } from "react";
import { User, Wallet, Activity, ArrowUpRight } from "lucide-react";
import { getWeb3Provider, formatAddress } from "@/lib/web3";
import { ethers } from "ethers";

export default function Profile() {
  const [address, setAddress] = useState<string>("Not Connected");
  const [balance, setBalance] = useState<string>("0.00");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { provider, signer } = await getWeb3Provider();
        const userAddress = await signer.getAddress();
        setAddress(userAddress);
        
        const userBalance = await provider.getBalance(userAddress);
        setBalance(ethers.formatEther(userBalance).substring(0, 6));
      } catch (err) {
        console.error("Could not fetch profile info", err);
      }
    };
    
    fetchProfile();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 mb-8 relative overflow-hidden">
        {/* Background Graphic */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff2a5f]/10 to-[#ff7e40]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3">
              Web3 Listener
              <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-gray-300">Beta User</span>
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm text-gray-400">
                <Wallet className="w-4 h-4 text-[#ff2a5f]" />
                {address !== "Not Connected" ? formatAddress(address) : address}
              </div>
              
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm font-medium">
                <span className="text-gray-400">Balance:</span>
                <span className="text-[#ff7e40]">{balance} ETH</span>
              </div>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors self-center">
            View on Explorer
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="text-[#ff2a5f] w-5 h-5" />
            Recent Activity
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
              <div>
                <p className="font-medium text-gray-300">Tipped &quot;Neon Dreams&quot;</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
              <span className="text-sm font-bold text-[#ff2a5f]">-0.01 ETH</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
              <div>
                <p className="font-medium text-gray-300">Minted Artist NFT</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
              <span className="text-sm font-bold text-[#ff2a5f]">-0.05 ETH</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 text-gray-300">Your NFT Collection</h2>
          <div className="flex items-center justify-center h-40 border-2 border-dashed border-[#2a2a2a] rounded-2xl text-gray-500">
            No NFTs collected yet
          </div>
        </div>
      </div>
    </div>
  );
}
