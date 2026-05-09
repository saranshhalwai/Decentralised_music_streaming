"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, AlertCircle, Loader2, ExternalLink, ShieldCheck, Download } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getWeb3Provider } from "@/lib/web3";
import { getPaymentContract, PAYMENT_ADDRESS } from "@/lib/contracts";
import { ethers } from "ethers";
import Image from "next/image";
import { EthersError } from "@/types/global.d";

const fallbackTrack = {
  id: "sample",
  title: "Demo BeatChain Track",
  artist_name: "Sample Artist",
  genre: "Sample",
  coverArtCID: "",
  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  artist_address: "0x0000000000000000000000000000000000000000",
  ipfsCID: "",
  coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
  playCount: BigInt(0)
};

const GATEWAYS = [
  `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "gateway.pinata.cloud"}/ipfs/`,
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/"
];

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const { currentTrack, isPlaying, setIsPlaying, volume, setVolume, audioRef } = useAudioPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [useBlobUrl, setUseBlobUrl] = useState<string | null>(null);
  
  const lastTrackId = useRef<string | null>(null);

  const track = useMemo(() => currentTrack ?? fallbackTrack, [currentTrack]);

  // Strategy: Try streaming first. If it fails multiple times, fetch the whole blob.
  const activeSrc = useMemo(() => {
    if (useBlobUrl) return useBlobUrl;
    if (!currentTrack || currentTrack.id === "sample") return fallbackTrack.src;
    const cid = currentTrack.ipfsCID;
    if (!cid || cid.length < 10) return "";
    return `${GATEWAYS[gatewayIndex]}${cid}`;
  }, [currentTrack, gatewayIndex, useBlobUrl]);

  // Unified Playback Control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && !isAwaitingPayment) {
      if (activeSrc.length > 0) {
        if (audio.readyState === 0) audio.load();
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== "AbortError" && err.name !== "NotSupportedError") {
              console.warn("Playback error:", err.name, activeSrc);
            }
          });
        }
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isAwaitingPayment, activeSrc, audioRef]);

  const fetchFullTrackAsBlob = useCallback(async (cid: string) => {
    try {
      setIsLoading(true);
      setError("Optimizing playback for your connection...");
      
      // Try the fastest gateway for a full download
      const response = await fetch(`${GATEWAYS[gatewayIndex]}${cid}`);
      if (!response.ok) throw new Error("Gateway failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setUseBlobUrl(url);
      setError(null);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("Blob fetch failed", e);
      return false;
    }
  }, [gatewayIndex]);

  const triggerPayment = useCallback(async (trackId: string) => {
    try {
      if (trackId === "sample") return true;
      if (!PAYMENT_ADDRESS || PAYMENT_ADDRESS.startsWith("0x0000")) return true;

      setIsAwaitingPayment(true);
      setError("Please confirm the stream payment (0.0001 ETH) in MetaMask...");

      const { signer } = await getWeb3Provider();
      const paymentContract = getPaymentContract(signer);
      const streamFee = ethers.parseEther("0.0001");
      
      const tx = await paymentContract.streamPayment(BigInt(trackId), { value: streamFee });
      
      setError("Payment confirmed! Loading track...");
      setIsAwaitingPayment(false);
      return true;
    } catch (err: unknown) {
      const error = err as EthersError;
      setIsAwaitingPayment(false);
      if (error.code === "ACTION_REJECTED") {
        setError("Payment required to stream this track.");
      } else {
        setError("Payment failed. Please check your balance.");
      }
      setIsPlaying(false);
      return false;
    }
  }, [setIsPlaying]);

  // Track Change logic
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== lastTrackId.current) {
      if (useBlobUrl) URL.revokeObjectURL(useBlobUrl);
      
      lastTrackId.current = currentTrack.id;
      setIsPlaying(false);
      
      setTimeout(async () => {
        setError(null);
        setGatewayIndex(0);
        setUseBlobUrl(null);
        setCurrentTime(0);
        setDuration(0);
        
        if (currentTrack.id !== "sample") {
          setIsLoading(true);
          const paymentSuccessful = await triggerPayment(currentTrack.id);
          if (paymentSuccessful) {
            setIsPlaying(true);
          }
        } else {
           setIsPlaying(true);
        }
      }, 0);
    }
  }, [currentTrack, setIsPlaying, triggerPayment, useBlobUrl]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  // Event handlers
  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, [audioRef]);

  const onLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    if (!isAwaitingPayment) setError(null);
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (d && !isNaN(d) && d !== Infinity) setDuration(d);
    }
  }, [audioRef, isAwaitingPayment]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const onAudioError = useCallback(async () => {
    if (useBlobUrl) {
      setError("Media Error: File is corrupted.");
      setIsPlaying(false);
      return;
    }

    if (gatewayIndex < 2) {
       // Switch to next gateway
       setGatewayIndex(prev => prev + 1);
    } else if (gatewayIndex === 2 && currentTrack?.ipfsCID) {
       // After 3 gateways fail, try fetching the whole thing as a blob
       const success = await fetchFullTrackAsBlob(currentTrack.ipfsCID);
       if (!success) {
         setGatewayIndex(prev => prev + 1);
       }
    } else if (gatewayIndex < GATEWAYS.length - 1) {
       setGatewayIndex(prev => prev + 1);
    } else {
      setIsLoading(false);
      setIsPlaying(false);
      setError("Media Error: High network congestion. Please try again later.");
    }
  }, [gatewayIndex, setIsPlaying, currentTrack, useBlobUrl, fetchFullTrackAsBlob]);

  const onCanPlay = useCallback(() => {
    setIsLoading(false);
    if (!isAwaitingPayment) setError(null);
  }, [isAwaitingPayment]);

  return (
    <div className="fixed bottom-0 w-full glass-panel border-t border-white/10 z-50 px-4 py-3">
      <audio 
        ref={audioRef} 
        src={activeSrc} 
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onError={onAudioError}
        onCanPlay={onCanPlay}
      />
      
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] rounded-md shadow-lg overflow-hidden relative">
            <Image 
              src={track.coverUrl || fallbackTrack.coverUrl} 
              alt="Cover" 
              fill
              unoptimized
              sizes="48px"
              className="object-cover" 
            />
            {(isLoading || isAwaitingPayment) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white line-clamp-1">{track.title}</h4>
            <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
            {track.id !== "sample" && (
              <div className="flex items-center gap-2 mt-0.5">
               <a 
                 href={activeSrc} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-[10px] text-[#ff2a5f] hover:underline flex items-center gap-1"
               >
                 <ExternalLink className="w-2 h-2" /> IPFS Source
               </a>
               {useBlobUrl && <span className="text-[10px] text-green-500 font-bold flex items-center gap-0.5"><Download className="w-2 h-2" /> Cached</span>}
              </div>
            )}
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center flex-1 max-w-xl w-full">
          <div className="flex items-center gap-6 mb-3">
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
              }}
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button
              disabled={isAwaitingPayment}
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isAwaitingPayment 
                ? "bg-gray-600 cursor-wait" 
                : "bg-white text-black hover:scale-105 active:scale-95 shadow-lg"
              }`}
            >
              {isAwaitingPayment ? (
                <ShieldCheck className="w-5 h-5 text-white animate-pulse" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-1" />
              )}
            </button>
            
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
              }}
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative group">
              <input
                aria-label="Track progress"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                step={0.1}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = time;
                  setCurrentTime(time);
                }}
                className="w-full h-2 bg-[#2a2a2a] appearance-none rounded-full accent-[#ff2a5f] cursor-pointer"
              />
              {error && (
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap shadow-xl z-20 ${
                  isAwaitingPayment ? "bg-blue-600 animate-pulse" : "bg-[#ff2a5f]"
                }`}>
                  {isAwaitingPayment ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {error}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 font-medium w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4 text-gray-400">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 md:w-32 h-2 accent-[#ff2a5f] cursor-pointer"
            />
          </div>
          <div className="hidden md:block text-xs text-gray-400 w-12">{(volume * 100).toFixed(0)}%</div>
          <Maximize2 className="w-4 h-4 hover:text-white cursor-pointer transition-colors ml-2" />
        </div>
      </div>
    </div>
  );
}
