"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Disc, Clock, Calendar, Heart, Share2, DollarSign } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/track";
import { getWeb3Provider } from "@/lib/web3";
import { getMusicRegistryContract } from "@/lib/contracts";
import { getIPFSUrl } from "@/lib/ipfs";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import Image from "next/image";

export default function TrackDetails() {
  const params = useParams();
  const id = params.id as string;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setIsPlaying } = useAudioPlayer();

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        setLoading(true);
        const { provider } = await getWeb3Provider();
        const registry = getMusicRegistryContract(provider);
        const t = await registry.getTrack(BigInt(id));
        
        setTrack({
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
        });
      } catch (err) {
        console.error("Error fetching track details", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTrack();
  }, [id]);

  const handlePlay = () => {
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
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
        {/* Cover Art */}
        <div className="w-full lg:w-1/3 aspect-square rounded-3xl overflow-hidden shadow-2xl relative group">
          <Image 
            src={track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop"} 
            alt={track.title} 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
               onClick={handlePlay}
               className="w-20 h-20 rounded-full bg-[#ff2a5f] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-10"
             >
               <Play className="w-10 h-10 ml-1 text-white fill-current" />
             </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#ff2a5f]/20 text-[#ff2a5f] text-xs font-bold uppercase tracking-widest border border-[#ff2a5f]/30">
                {track.genre}
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Play className="w-3 h-3" />
                {track.playCount.toString()} Streams
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">{track.title}</h1>
            <p className="text-2xl text-gray-400 font-medium">by {track.artist_name}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handlePlay}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] text-white font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-[#ff2a5f]/20"
            >
              <Play className="w-6 h-6 fill-current" />
              Play Now
            </button>
            <button className="px-8 py-4 rounded-full bg-[#141414] border border-[#2a2a2a] text-white font-bold text-lg flex items-center gap-3 hover:bg-[#1f1f1f] transition-all">
              <Heart className="w-6 h-6" />
              Collect
            </button>
            <button className="p-4 rounded-full bg-[#141414] border border-[#2a2a2a] text-white hover:bg-[#1f1f1f] transition-all">
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5">
             <InfoStat icon={<Disc className="w-4 h-4 text-[#ff2a5f]" />} label="Format" value="MP3 / IPFS" />
             <InfoStat icon={<Clock className="w-4 h-4 text-[#ff2a5f]" />} label="Duration" value="3:45" />
             <InfoStat icon={<Calendar className="w-4 h-4 text-[#ff2a5f]" />} label="Released" value="April 2026" />
             <InfoStat icon={<DollarSign className="w-4 h-4 text-[#ff2a5f]" />} label="Price" value="0.0001 ETH" />
          </div>

          <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 mt-8">
            <h3 className="text-xl font-bold mb-4">Blockchain Metadata</h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-gray-500">Track ID</span>
                <span className="text-gray-300">{track.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-gray-500">Artist Address</span>
                <span className="text-[#ff2a5f]">{track.artist_address}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-gray-500">Audio IPFS CID</span>
                <span className="text-gray-300 truncate ml-8">{track.ipfsCID}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}
