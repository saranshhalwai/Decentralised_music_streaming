"use client";

import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Music, Play, Calendar, ChevronLeft, Shuffle, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/track";
import TrackCard from "@/components/TrackCard";

interface CommunityPlaylist {
  id: string;
  name: string;
  description: string;
  creator: string;
  timestamp: number;
  trackIds: string[];
}

export default function CommunityPlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setCurrentTrack, setIsPlaying, setQueue } = useAudioPlayer();
  
  const [playlist, setPlaylist] = useState<CommunityPlaylist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylistData() {
      try {
        setLoading(true);
        const { getReadOnlyProvider } = await import("@/lib/web3");
        const { getPlaylistRegistryContract, getMusicRegistryContract } = await import("@/lib/contracts");
        const { getIPFSUrl } = await import("@/lib/ipfs");
        
        const provider = getReadOnlyProvider();
        const playlistRegistry = getPlaylistRegistryContract(provider);
        const musicRegistry = getMusicRegistryContract(provider);
        
        const p = await playlistRegistry.getPlaylist(BigInt(id as string));
        setPlaylist({
          id: p.id.toString(),
          name: p.name,
          description: p.description,
          creator: p.creator,
          timestamp: Number(p.timestamp),
          trackIds: p.trackIds.map((tid: bigint) => tid.toString())
        });

        const trackData = await Promise.all(
          p.trackIds.map(async (tid: bigint) => {
            try {
              const t = await musicRegistry.getTrack(tid);
              return {
                id: t.id.toString(),
                title: t.title,
                artist_name: t.artistName,
                artist_address: t.artist,
                genre: t.genre,
                ipfsCID: t.ipfsCID,
                coverArtCID: t.coverArtCID,
                src: getIPFSUrl(t.ipfsCID),
                coverUrl: getIPFSUrl(t.coverArtCID),
                playCount: Number(t.playCount),
                timestamp: t.timestamp
              } as Track;
            } catch {
              return null;
            }
          })
        );
        
        setTracks(trackData.filter((t): t is Track => t !== null));
      } catch (err) {
        console.error("Failed to fetch community playlist", err);
        router.push("/explore");
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylistData();
  }, [id, router]);

  if (loading && !playlist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 text-[#3b82f6] animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-bold">Loading on-chain playlist...</p>
      </div>
    );
  }

  if (!playlist) return null;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks);
      setCurrentTrack(tracks[0]);
      setIsPlaying(true);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        href="/explore" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Explore
      </Link>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-full md:w-72 aspect-square rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] shadow-2xl flex items-center justify-center overflow-hidden border border-blue-500/20 relative group">
          <div className="p-12 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500">
            <Music className="w-24 h-24 text-blue-500/40" />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="w-16 h-16 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </button>
          </div>
          <div className="absolute bottom-4 right-4 bg-[#3b82f6] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
            On-Chain
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end py-2">
          <div className="flex items-center gap-2 text-[#3b82f6] font-bold uppercase tracking-[0.2em] text-xs mb-3">
            <ShieldCheck className="w-4 h-4" />
            Verified Community Playlist
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">{playlist.name}</h1>
          <p className="text-gray-400 text-lg mb-6 max-w-2xl">{playlist.description || "A community-curated music collection stored permanently on the blockchain."}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Created by <span className="font-mono text-xs">{playlist.creator}</span>
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              {tracks.length} Tracks
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Shared {formatDate(playlist.timestamp)}
            </span>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] transition-all font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Play All
            </button>
            <button 
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold border border-white/10"
            >
              <Shuffle className="w-5 h-5" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">On-Chain Tracks</h2>
          <div className="h-px flex-1 mx-8 bg-gradient-to-r from-[#2a2a2a] to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} onPlay={setCurrentTrack} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
