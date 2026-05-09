"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeft, Play, Disc, Clock, Calendar, Heart, Share2, DollarSign, AlertTriangle, ShieldAlert, Award, Loader2 } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/track";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getMusicRegistryContract, getDisputeResolutionContract, getMusicNFTContract } from "@/lib/contracts";
import { getIPFSUrl } from "@/lib/ipfs";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import Image from "next/image";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TrackDetails() {
  const params = useParams();
  const id = params.id as string;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const { setCurrentTrack, setIsPlaying, currentTrack, audioRef } = useAudioPlayer();

  // Image state with multi-step fallback
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_IMAGE);
  const [retryCount, setRetryCount] = useState(0);
  const [duration, setDuration] = useState<number>(0);

  const fetchTrack = useCallback(async () => {
    try {
      setLoading(true);
      const provider = getReadOnlyProvider();
      const registry = getMusicRegistryContract(provider);
      const t = await registry.getTrack(BigInt(id));
      
      const formattedTrack: Track = {
        id: t.id.toString(),
        title: t.title,
        artist_name: t.artistName,
        artist_address: t.artist,
        genre: t.genre,
        ipfsCID: t.ipfsCID,
        coverArtCID: t.coverArtCID,
        src: getIPFSUrl(t.ipfsCID) || "",
        coverUrl: getIPFSUrl(t.coverArtCID) || "",
        playCount: t.playCount,
        timestamp: t.timestamp,
      };
      setTrack(formattedTrack);
      setImgSrc(formattedTrack.coverUrl || FALLBACK_IMAGE);
      setRetryCount(0);

      // Check ownership
      try {
        const { signer } = await getWeb3Provider();
        const address = await signer.getAddress();
        setUserAddress(address);
        setIsOwner(t.artist.toLowerCase() === address.toLowerCase());
      } catch {
        // Not connected
      }
    } catch (err) {
      console.error("Error fetching track details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        void fetchTrack();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [id, fetchTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    audio.addEventListener('loadedmetadata', updateDuration);
    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioRef, currentTrack]);

  const handlePlay = () => {
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const sanitizeCid = (cid?: string) => {
    if (!cid) return "";
    let s = cid;
    if (s.startsWith("ipfs://")) s = s.replace(/^ipfs:\/\//, "");
    if (s.startsWith("/ipfs/")) s = s.replace(/^\/ipfs\//, "");
    return s;
  };

  const handleImageError = () => {
    if (track?.coverArtCID) {
      const sanitized = sanitizeCid(track.coverArtCID);
      if (retryCount === 0) {
        console.log(`Primary gateway failed for detail view, trying pinata gateway...`);
        setImgSrc(getIPFSUrl(sanitized));
        setRetryCount(1);
      } else if (retryCount === 1) {
        console.log(`Pinata failed for detail view, trying Cloudflare...`);
        setImgSrc(`https://cloudflare-ipfs.com/ipfs/${sanitized}`);
        setRetryCount(2);
      } else if (retryCount === 2) {
        console.log(`Cloudflare failed for detail view, trying ipfs.io...`);
        setImgSrc(`https://ipfs.io/ipfs/${sanitized}`);
        setRetryCount(3);
      } else {
        setImgSrc(FALLBACK_IMAGE);
      }
    } else {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const displayDuration = useMemo(() => {
    if (currentTrack?.id === id && duration) {
      return formatTime(duration);
    }
    return "3:45"; 
  }, [currentTrack, id, duration]);

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  
  // NFT state
  const [isMinting, setIsMinting] = useState(false);

  const handleOpenDispute = async () => {
    if (!disputeReason) return;
    try {
      setIsSubmittingDispute(true);
      const { signer } = await getWeb3Provider();
      const disputeContract = getDisputeResolutionContract(signer);
      const minStake = await disputeContract.MIN_DISPUTE_STAKE();
      const tx = await disputeContract.openDispute(BigInt(id), disputeReason, { value: minStake });
      await tx.wait();
      alert("Dispute opened successfully!");
      setShowDisputeModal(false);
      setDisputeReason("");
    } catch {
      alert("Failed to open dispute.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleMintNFT = async () => {
    if (!track) return;
    try {
      setIsMinting(true);
      const { signer } = await getWeb3Provider();
      const nftContract = getMusicNFTContract(signer);
      const tx = await nftContract.mintCollectible(userAddress!, BigInt(id), track.ipfsCID, userAddress!, 250);
      await tx.wait();
      alert("NFT Minted successfully!");
    } catch {
      alert("Failed to mint NFT.");
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#ff2a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Track not found</h1>
        <Link href="/explore" className="text-[#ff2a5f] hover:underline">Return to Explore</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="w-full lg:w-1/3 aspect-square rounded-3xl overflow-hidden shadow-2xl relative group bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
          <Image 
            src={imgSrc} 
            alt={track.title} 
            onError={handleImageError}
            fill
            unoptimized
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 relative z-0"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
             <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-[#ff2a5f] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
               <Play className="w-10 h-10 ml-1 text-white fill-current" />
             </button>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#ff2a5f]/20 text-[#ff2a5f] text-xs font-bold uppercase tracking-widest border border-[#ff2a5f]/30">{track.genre}</span>
                <span className="flex items-center gap-1 text-gray-500 text-sm"><Play className="w-3 h-3" />{track.playCount.toString()} Streams</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">{track.title}</h1>
              <p className="text-2xl text-gray-400 font-medium">by {track.artist_name}</p>
            </div>
            <div className="flex flex-col gap-2">
              {isOwner && (
                 <button onClick={handleMintNFT} disabled={isMinting} className="px-6 py-3 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-xl">
                  {isMinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}Mint Exclusive NFT
                </button>
              )}
              <button onClick={() => setShowDisputeModal(true)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all">
                <ShieldAlert className="w-4 h-4" />Report Infringement
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={handlePlay} className="px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] text-white font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-[#ff2a5f]/20">
              <Play className="w-6 h-6 fill-current" />Play Now
            </button>
            <Link href="/marketplace" className="px-8 py-4 rounded-full bg-[#141414] border border-[#2a2a2a] text-white font-bold text-lg flex items-center gap-3 hover:bg-[#1f1f1f] transition-all">
              <Heart className="w-6 h-6" />Collect
            </Link>
            <button onClick={() => {navigator.clipboard.writeText(window.location.href); alert("Link copied!");}} className="p-4 rounded-full bg-[#141414] border border-[#2a2a2a] text-white hover:bg-[#1f1f1f] transition-all">
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5">
             <InfoStat icon={<Disc className="w-4 h-4 text-[#ff2a5f]" />} label="Format" value="MP3 / IPFS" />
             <InfoStat icon={<Clock className="w-4 h-4 text-[#ff2a5f]" />} label="Duration" value={displayDuration} />
             <InfoStat icon={<Calendar className="w-4 h-4 text-[#ff2a5f]" />} label="Released" value={track.timestamp ? new Date(Number(track.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Unknown"} />
             <InfoStat icon={<DollarSign className="w-4 h-4 text-[#ff2a5f]" />} label="Price" value="0.0001 ETH" />
          </div>

          <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSign className="text-[#ff2a5f]" />Support the Artist</h3>
            <p className="text-gray-400 mb-6 text-sm">Send a direct tip to {track.artist_name} to support their work.</p>
            <div className="flex flex-wrap gap-4">
              {[0.001, 0.005, 0.01].map((amt) => (
                <button key={amt} onClick={async () => {
                     try {
                        const { getWeb3Provider } = await import("@/lib/web3");
                        const { getPaymentContract } = await import("@/lib/contracts");
                        const { ethers } = await import("ethers");
                        const { signer } = await getWeb3Provider();
                        const payment = getPaymentContract(signer);
                        const tx = await payment.tipTrack(BigInt(track.id), { value: ethers.parseEther(amt.toString()) });
                        await tx.wait();
                        alert(`Successfully tipped ${amt} ETH!`);
                     } catch {alert("Tip failed.");}
                  }} className="px-6 py-3 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#ff2a5f]/10 hover:border-[#ff2a5f]/50 hover:text-[#ff2a5f] transition-all font-bold">{amt} ETH</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
              <div><h2 className="text-2xl font-bold">Open Ownership Dispute</h2><p className="text-sm text-gray-400">Claims require a 0.01 ETH stake</p></div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Evidence / Reason</label>
                <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Explain why you are claiming ownership..." className="w-full h-32 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-colors">Cancel</button>
                <button disabled={!disputeReason || isSubmittingDispute} onClick={handleOpenDispute} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}Submit Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">{icon}{label}</div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}
