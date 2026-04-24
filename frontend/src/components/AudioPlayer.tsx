"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getWeb3Provider } from "@/lib/web3";
import { getPaymentContract } from "@/lib/contracts";
import { ethers } from "ethers";

const fallbackTrack = {
  id: "sample",
  title: "Demo BeatChain Track",
  artist_name: "Sample Artist",
  genre: "Sample",
  coverArtCID: "",
  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const { currentTrack, isPlaying, setIsPlaying, volume, setVolume } = useAudioPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = useMemo(() => currentTrack ?? fallbackTrack, [currentTrack]);
  const coverUrl = track.coverArtCID
    ? `https://gateway.pinata.cloud/ipfs/${track.coverArtCID}`
    : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (currentTrack && currentTrack.id !== "sample") {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      
      // Handle micro-payment for stream
      const processPayment = async () => {
        try {
          const { signer } = await getWeb3Provider();
          const paymentContract = getPaymentContract(signer);
          
          // Small stream fee: 0.0001 ETH
          const streamFee = ethers.parseEther("0.0001");
          const tx = await paymentContract.streamPayment(currentTrack.id, { value: streamFee });
          console.log("Stream payment sent:", tx.hash);
          // We don't necessarily need to wait for it to be mined to play the song
          // but we could for stricter enforcement
        } catch (error) {
          console.error("Stream payment failed:", error);
        }
      };
      
      processPayment();
    }
  }, [currentTrack, setIsPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = (Number(event.target.value) / 100) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="fixed bottom-0 w-full glass-panel border-t border-white/10 z-50 px-4 py-3">
      <audio ref={audioRef} src={track.src ?? fallbackTrack.src} preload="metadata" />
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] rounded-md shadow-lg overflow-hidden">
            <img src={coverUrl} alt="Cover art" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{track.title}</h4>
            <p className="text-xs text-gray-400">{track.artist_name}</p>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-xl w-full">
          <div className="flex items-center gap-6 mb-3">
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                audio.currentTime = Math.max(audio.currentTime - 10, 0);
              }}
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                audio.currentTime = Math.min(audio.currentTime + 10, duration || audio.duration || 0);
              }}
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <input
                aria-label="Track progress"
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-[#2a2a2a] appearance-none rounded-full accent-[#ff2a5f] cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">{formatTime(duration || 0)}</span>
          </div>
        </div>

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
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-24 md:w-32 h-2 accent-[#ff2a5f] cursor-pointer"
            />
          </div>
          <div className="hidden md:block text-xs text-gray-400">Vol {(volume * 100).toFixed(0)}%</div>
          <Maximize2 className="w-4 h-4 hover:text-white cursor-pointer transition-colors ml-2" />
        </div>
      </div>
    </div>
  );
}
