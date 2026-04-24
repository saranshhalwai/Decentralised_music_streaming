"use client";

import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import { Search, Flame } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getWeb3Provider } from "@/lib/web3";
import { getMusicRegistryContract } from "@/lib/contracts";
import { getIPFSUrl } from "@/lib/ipfs";

import { Track } from "@/types/track";

export default function ExplorePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { setCurrentTrack, setIsPlaying } = useAudioPlayer();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        // We can use a public provider here if we don't want to force login just to browse
        // But for simplicity in this dev environment, we use getWeb3Provider
        const { provider } = await getWeb3Provider();
        const registry = getMusicRegistryContract(provider);
        
        const count = await registry.totalTracks();
        const trackCount = Number(count);
        
        const fetchedTracks: Track[] = [];
        for (let i = 0; i < trackCount; i++) {
          try {
            const trackData = await registry.getTrack(i);
            fetchedTracks.push({
              id: trackData.id.toString(),
              title: trackData.title,
              artist_name: trackData.artistName,
              artist_address: trackData.artist,
              genre: trackData.genre,
              ipfsCID: trackData.ipfsCID,
              coverArtCID: trackData.coverArtCID,
              src: getIPFSUrl(trackData.ipfsCID),
              coverUrl: getIPFSUrl(trackData.coverArtCID),
              playCount: Number(trackData.playCount),
            });
          } catch (e) {
            console.error(`Error fetching track ${i}:`, e);
          }
        }
        
        // Sort by playCount or newest first
        setTracks(fetchedTracks.reverse());
      } catch (error) {
        console.error("Error fetching tracks from blockchain:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [setCurrentTrack, setIsPlaying]);

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.artist_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3 mb-2">
            <Flame className="text-[#ff2a5f] w-8 h-8" />
            Trending Tracks
          </h1>
          <p className="text-gray-400">Discover the best decentralized music.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-full text-sm placeholder-gray-500 focus:border-[#ff2a5f] focus:ring-1 focus:ring-[#ff2a5f] transition-all outline-none"
            placeholder="Search tracks or artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-2xl bg-[#141414] h-[350px] border border-[#2a2a2a]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredTracks.map(track => (
            <TrackCard key={track.id} track={track} onPlay={handlePlay} />
          ))}
        </div>
      )}
      
      {!loading && filteredTracks.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl">No tracks found matching &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
