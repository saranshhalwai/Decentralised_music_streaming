"use client";

import { Play, Disc, Heart, DollarSign, ExternalLink } from "lucide-react";
import { Track } from "@/types/track";
import Link from "next/link";
import { getIPFSUrl } from "@/lib/ipfs";
import { useState, useEffect } from "react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";

export default function TrackCard({ track, onPlay }: { track: Track; onPlay: (track: Track) => void }) {
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_IMAGE);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (track.coverUrl && track.coverUrl.length > 5) {
      setImgSrc(track.coverUrl);
    } else {
      setImgSrc(FALLBACK_IMAGE);
    }
    setRetryCount(0);
  }, [track.coverUrl]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay(track);
  };

  const sanitizeCid = (cid?: string) => {
    if (!cid) return "";
    let s = cid;
    if (s.startsWith("ipfs://")) s = s.replace(/^ipfs:\/\//, "");
    if (s.startsWith("/ipfs/")) s = s.replace(/^\/ipfs\//, "");
    return s;
  };

  const handleImageError = () => {
    if (track.coverArtCID) {
      const sanitized = sanitizeCid(track.coverArtCID);
      if (retryCount === 0) {
        console.log(`Primary gateway failed for ${track.title}, trying pinata gateway...`);
        setImgSrc(getIPFSUrl(sanitized));
        setRetryCount(1);
      } else if (retryCount === 1) {
        console.log(`Pinata failed for ${track.title}, trying Cloudflare...`);
        setImgSrc(`https://cloudflare-ipfs.com/ipfs/${sanitized}`);
        setRetryCount(2);
      } else if (retryCount === 2) {
        console.log(`Cloudflare failed for ${track.title}, trying ipfs.io...`);
        setImgSrc(`https://ipfs.io/ipfs/${sanitized}`);
        setRetryCount(3);
      } else {
        setImgSrc(FALLBACK_IMAGE);
      }
    } else {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#ff2a5f]/50 transition-all duration-300 shadow-xl">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
        {/* Using native img tag to bypass Next.js Image component domain restrictions and optimization overhead for decentralized sources */}
        <img 
          src={imgSrc} 
          alt={track.title} 
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-0"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-10">
          <button 
            onClick={handlePlayClick}
            className="w-14 h-14 rounded-full bg-[#ff2a5f] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 glow-effect"
          >
            <Play className="w-7 h-7 ml-1" fill="currentColor" />
          </button>
          <Link 
            href={`/track/${track.id}`}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 transition-transform duration-300"
          >
            <ExternalLink className="w-6 h-6" />
          </Link>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/track/${track.id}`} className="hover:underline flex-1">
            <h3 className="font-bold text-lg line-clamp-1">{track.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-1">{track.artist_name}</p>
          </Link>
          <div className="flex gap-2">
            <button 
              className="text-gray-500 hover:text-[#ff2a5f] transition-colors"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const { getWeb3Provider } = await import("@/lib/web3");
                  const { getPaymentContract } = await import("@/lib/contracts");
                  const { ethers } = await import("ethers");
                  const { signer } = await getWeb3Provider();
                  const payment = getPaymentContract(signer);
                  const tx = await payment.tipTrack(BigInt(track.id), { value: ethers.parseEther("0.001") });
                  await tx.wait();
                  alert("Quick tip sent!");
                } catch (err) {
                  alert("Tip failed.");
                }
              }}
            >
              <DollarSign className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-[#ff2a5f] transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1 bg-[#1f1f1f] px-2 py-1 rounded-md">
            <Disc className="w-3 h-3" />
            {track.genre}
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {track.playCount.toString()}
          </span>
        </div>
      </div>
    </div>
  );
}
