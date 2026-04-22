"use client";

import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import { Search, Flame } from "lucide-react";
import { getWeb3Provider } from "@/lib/web3";
import { ethers } from "ethers";
import { MUSIC_REGISTRY_ADDRESS, MusicRegistryABI } from "@/lib/contracts";

export default function ExplorePage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // In a real app, we would fetch from the blockchain here.
    // Since the deployment step is skipped, we provide mock data for the UI.
    const loadMockData = () => {
      setTracks([
        {
          id: "1",
          title: "Neon Dreams",
          artist_name: "Synthwave Master",
          genre: "Synthwave",
          ipfsCID: "",
          coverArtCID: "",
          playCount: 1250,
        },
        {
          id: "2",
          title: "Cyber City Protocol",
          artist_name: "Byte Runner",
          genre: "Electronic",
          ipfsCID: "",
          coverArtCID: "",
          playCount: 890,
        },
        {
          id: "3",
          title: "Blockchain Beats",
          artist_name: "Crypto DJ",
          genre: "Hip Hop",
          ipfsCID: "",
          coverArtCID: "",
          playCount: 3420,
        },
        {
          id: "4",
          title: "Decentralized Lofi",
          artist_name: "Chill Nodes",
          genre: "Lofi",
          ipfsCID: "",
          coverArtCID: "",
          playCount: 560,
        }
      ]);
      setLoading(false);
    };

    loadMockData();
  }, []);

  const handlePlay = (track: any) => {
    console.log("Playing track:", track.title);
    // In a full implementation, this would trigger the global AudioPlayer context
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
          <p className="text-xl">No tracks found matching "{search}"</p>
        </div>
      )}
    </div>
  );
}
