"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TrackCard from "@/components/TrackCard";
import { Search, Flame } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { artists as artistData, tracks as trackData, Artist, Track } from "@/lib/mockData";

const categories = ["All", "Artists", "Albums", "EPs", "Singles"];

export default function ExplorePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { setCurrentTrack, setIsPlaying } = useAudioPlayer();

  useEffect(() => {
    setArtists(artistData);
    setTracks(trackData);
    setLoading(false);
  }, []);

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const filteredTracks = tracks.filter((t) =>
    (t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artists.join(" ").toLowerCase().includes(search.toLowerCase()) ||
      t.collection.toLowerCase().includes(search.toLowerCase())) &&
    (selectedCategory === "All" || selectedCategory === "Artists" || t.type === selectedCategory)
  );

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(search.toLowerCase()) ||
    artist.genre.toLowerCase().includes(search.toLowerCase())
  );

  const showArtistView = selectedCategory === "Artists";

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#ff7e40] mb-4">Decentralized Spotify</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">Browse artists, albums, EPs, and singles.</h1>
            <p className="max-w-2xl text-gray-400 text-lg">Discover the best music from decentralized creators and stream directly from IPFS.</p>
          </div>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-[#121212] border border-[#2a2a2a] rounded-full text-sm placeholder-gray-500 focus:border-[#ff2a5f] focus:ring-1 focus:ring-[#ff2a5f] transition-all outline-none"
              placeholder="Search artists, albums, EPs, singles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? "bg-[#ff2a5f] text-black"
                  : "bg-[#121212] text-gray-300 hover:bg-[#1f1f1f]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl bg-[#121212] h-[360px] border border-[#2a2a2a]"></div>
            ))}
          </div>
        ) : showArtistView ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Link key={artist.id} href={`/artists/${artist.id}`} className="group rounded-3xl overflow-hidden bg-[#121212] border border-[#2a2a2a] hover:border-[#ff2a5f] transition-all">
                <div className="aspect-square overflow-hidden">
                  <img src={artist.coverArt} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-1">{artist.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{artist.genre} • {artist.followers.toLocaleString()} followers</p>
                  <p className="text-sm text-gray-400">Wallet: <span className="font-medium text-white">{artist.wallet}</span></p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} onPlay={handlePlay} />
            ))}
          </div>
        )}

        {!loading && ((showArtistView && filteredArtists.length === 0) || (!showArtistView && filteredTracks.length === 0)) && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No results found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
