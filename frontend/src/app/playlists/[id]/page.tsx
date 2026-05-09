"use client";

import { usePlaylists } from "@/context/PlaylistContext";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Music, Play, Trash2, Clock, Calendar, ChevronLeft, Shuffle, Share2, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/track";
import TrackCard from "@/components/TrackCard";
import Image from "next/image";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getPlaylist, removeFromPlaylist, deletePlaylist, sharePlaylistOnChain } = usePlaylists();
  const { setCurrentTrack, setIsPlaying, setQueue } = useAudioPlayer();
  
  const playlistId = id as string;
  const playlist = useMemo(() => getPlaylist(playlistId), [playlistId, getPlaylist]);
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareHash, setShareHash] = useState<string | null>(null);

  useEffect(() => {
    if (!playlist && !loading) {
      router.push("/playlists");
    }
  }, [playlist, loading, router]);

  useEffect(() => {
    async function fetchTracks() {
      if (!playlist || playlist.trackIds.length === 0) {
        setTracks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { getReadOnlyProvider } = await import("@/lib/web3");
        const { getMusicRegistryContract } = await import("@/lib/contracts");
        const { getIPFSUrl } = await import("@/lib/ipfs");
        
        const provider = getReadOnlyProvider();
        const registry = getMusicRegistryContract(provider);
        
        const trackData = await Promise.all(
          playlist.trackIds.map(async (tid) => {
            try {
              const t = await registry.getTrack(BigInt(tid));
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
            } catch (err) {
              console.error(`Failed to fetch track ${tid}`, err);
              return null;
            }
          })
        );
        
        setTracks(trackData.filter((t): t is Track => t !== null));
      } catch (err) {
        console.error("Failed to fetch playlist tracks", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTracks();
  }, [playlist]); 

  if (!playlist) return null;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks);
      setCurrentTrack(tracks[0]);
      setIsPlaying(true);
    }
  };

  const handleShare = async () => {
    if (!playlist) return;
    setIsSharing(true);
    try {
      const hash = await sharePlaylistOnChain(playlist.id);
      setShareHash(hash);
      alert("Playlist shared to blockchain successfully!");
    } catch {
      alert("Failed to share playlist. Check console for details.");
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        href="/playlists" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Playlists
      </Link>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-full md:w-72 aspect-square rounded-3xl bg-gradient-to-br from-[#2a2a2a] to-[#141414] shadow-2xl flex items-center justify-center overflow-hidden border border-white/5 relative group">
          {playlist.coverUrl ? (
            <Image 
              src={playlist.coverUrl} 
              alt={playlist.name} 
              fill
              className="w-full h-full object-cover" 
            />
          ) : (
            <Music className="w-24 h-24 text-gray-700" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <button 
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="w-16 h-16 rounded-full bg-[#ff2a5f] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end py-2">
          <p className="text-[#ff2a5f] font-bold uppercase tracking-[0.2em] text-xs mb-3">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">{playlist.name}</h1>
          <p className="text-gray-400 text-lg mb-6 max-w-2xl">{playlist.description || "No description provided for this collection."}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff2a5f]" />
              {tracks.length} Tracks
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Created {formatDate(playlist.createdAt)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated {formatDate(playlist.updatedAt)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#ff2a5f] hover:bg-[#ff2a5f]/90 transition-all font-bold shadow-lg shadow-[#ff2a5f]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button 
              onClick={handleShare}
              disabled={isSharing || tracks.length === 0}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] transition-all font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
              Share to Blockchain
            </button>
            <button 
              onClick={() => {
                if (confirm("Delete this playlist?")) {
                  deletePlaylist(playlist.id);
                  router.push("/playlists");
                }
              }}
              className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {shareHash && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-green-500">Shared on-chain!</p>
                <p className="text-[10px] text-green-500/70 truncate font-mono">{shareHash}</p>
              </div>
              <a 
                href={`https://sepolia.etherscan.io/tx/${shareHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-green-500 hover:underline px-3 py-1 bg-green-500/10 rounded-lg"
              >
                View
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tracks</h2>
          <div className="h-px flex-1 mx-8 bg-gradient-to-r from-[#2a2a2a] to-transparent" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-[#141414] rounded-2xl animate-pulse border border-[#2a2a2a]" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-20 text-center bg-[#141414] rounded-3xl border border-[#2a2a2a]">
            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">This playlist is empty.</p>
            <Link href="/explore">
              <button className="px-6 py-2 rounded-lg bg-[#ff2a5f] font-bold">Find Tracks</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="relative group/item">
                <TrackCard track={track} onPlay={setCurrentTrack} />
                <button 
                  onClick={() => removeFromPlaylist(playlist.id, track.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity z-20 shadow-xl hover:scale-110 active:scale-90"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
