"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { User, Wallet, ArrowUpRight, Music, TrendingUp, DollarSign, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getWeb3Provider, formatAddress } from "@/lib/web3";
import { getMusicRegistryContract, getPaymentContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import TrackCard from "@/components/TrackCard";
import { Track } from "@/types/track";
import { getIPFSUrl } from "@/lib/ipfs";
import { EthersError } from "@/types/global.d";

interface RawTrack {
  id: bigint;
  artist: string;
  title: string;
  artistName: string;
  genre: string;
  ipfsCID: string;
  coverArtCID: string;
  timestamp: bigint;
  playCount: bigint;
  exists: boolean;
}

export default function Profile() {
  const [address, setAddress] = useState<string>("Not Connected");
  const [balance, setBalance] = useState<string>("0.00");
  const [earnings, setEarnings] = useState<string>("0.00");
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const { setCurrentTrack, setIsPlaying } = useAudioPlayer();
  const hasFetched = useRef(false);

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { provider, signer } = await getWeb3Provider();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
      
      const userBalance = await provider.getBalance(userAddress);
      setBalance(ethers.formatEther(userBalance).substring(0, 6));

      // Fetch Artist Earnings
      const paymentContract = getPaymentContract(provider);
      const artistEarnings = await paymentContract.earningsOf(userAddress);
      setEarnings(ethers.formatEther(artistEarnings));

      // Fetch Artist Tracks
      const registryContract = getMusicRegistryContract(provider);
      const rawTracks: RawTrack[] = await registryContract.getTracksByArtist(userAddress);
      
      const formattedTracks: Track[] = rawTracks.map((t) => ({
        id: t.id.toString(),
        title: t.title,
        artist_name: t.artistName,
        genre: t.genre,
        ipfsCID: t.ipfsCID,
        coverArtCID: t.coverArtCID,
        artist_address: t.artist,
        playCount: t.playCount,
        src: getIPFSUrl(t.ipfsCID) || "",
        coverUrl: getIPFSUrl(t.coverArtCID) || ""
      }));

      setArtistTracks(formattedTracks);
    } catch (err) {
      console.error("Could not fetch profile info", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchProfileData();
    }
  }, [fetchProfileData]);

  const handleWithdraw = async () => {
    if (parseFloat(earnings) === 0) return;
    
    try {
      setIsWithdrawing(true);
      setTxStatus(null);
      const { signer } = await getWeb3Provider();
      const paymentContract = getPaymentContract(signer);
      
      const tx = await paymentContract.withdrawEarnings();
      setTxStatus({ type: 'success', message: 'Withdrawal transaction sent. Waiting for confirmation...' });
      
      await tx.wait();
      setTxStatus({ type: 'success', message: 'Earnings successfully withdrawn to your wallet!' });
      
      // Refresh data
      fetchProfileData();
    } catch (err: unknown) {
      const error = err as EthersError;
      console.error("Withdrawal failed", error);
      if (error.code !== "ACTION_REJECTED") {
        setTxStatus({ type: 'error', message: error.message || 'Withdrawal failed. Please try again.' });
      } else {
        setTxStatus(null);
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#ff2a5f] animate-spin" />
        <p className="text-gray-400 animate-pulse">Loading your Web3 profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ff2a5f]/10 to-[#ff7e40]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
               <User className="w-12 h-12 text-gray-500" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
               <h1 className="text-4xl font-black text-white tracking-tight">
                {artistTracks.length > 0 ? "Artist Dashboard" : "Collector Profile"}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-[#ff2a5f]/20 text-[#ff2a5f] rounded-full border border-[#ff2a5f]/30">
                Verified
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm text-gray-300">
                <Wallet className="w-4 h-4 text-[#ff2a5f]" />
                <span className="font-mono">{formatAddress(address)}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm font-medium">
                <span className="text-gray-500">Wallet:</span>
                <span className="text-[#ff7e40]">{balance} ETH</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <a 
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
            >
              Explorer
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </div>

      {txStatus && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border shadow-lg animate-in slide-in-from-top duration-300 ${
          txStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {txStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{txStatus.message}</p>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Earnings Card */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-32 h-32" />
            </div>
            
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-400">
              <TrendingUp className="text-[#ff2a5f] w-5 h-5" />
              Claimable Earnings
            </h2>
            
            <div className="mb-8">
              <span className="text-5xl font-black text-white">{parseFloat(earnings).toFixed(4)}</span>
              <span className="text-lg font-bold text-gray-500 ml-2">ETH</span>
            </div>
            
            <button 
              disabled={parseFloat(earnings) === 0 || isWithdrawing}
              onClick={handleWithdraw}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                parseFloat(earnings) > 0 && !isWithdrawing
                  ? "bg-[#ff2a5f] text-white hover:scale-[1.02] active:scale-95 shadow-[#ff2a5f]/20 hover:shadow-[#ff2a5f]/40"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Withdraw to Wallet
                </>
              )}
            </button>
            
            <p className="text-[10px] text-gray-600 mt-4 text-center uppercase tracking-widest font-bold">
              Automatic Artist Royalties Enabled
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8">
            <h2 className="text-lg font-bold mb-6 text-gray-300">Platform Stats</h2>
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 text-sm">Tracks Uploaded</span>
                 <span className="text-white font-bold">{artistTracks.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 text-sm">Total Streams</span>
                 <span className="text-white font-bold">
                   {artistTracks.reduce((acc, t) => acc + Number(t.playCount), 0)}
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 text-sm">Collection Size</span>
                 <span className="text-white font-bold">0 NFTs</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Music className="text-[#ff2a5f] w-6 h-6" />
              {artistTracks.length > 0 ? "Your Published Tracks" : "Recent Activity"}
            </h2>
            {artistTracks.length > 0 && (
              <span className="text-xs text-gray-500">{artistTracks.length} items</span>
            )}
          </div>
          
          {artistTracks.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {artistTracks.map((track) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onPlay={handlePlayTrack} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-3xl text-center px-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Music className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No tracks published yet</h3>
              <p className="text-gray-500 max-w-xs mx-auto text-sm">
                Switch to the Dashboard to upload your first track and start earning ETH from streams.
              </p>
              <a 
                href="/dashboard"
                className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
