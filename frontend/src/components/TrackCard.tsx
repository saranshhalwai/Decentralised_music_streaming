import { Play, Disc, Heart, Music2 } from "lucide-react";
import { Track as SharedTrack } from "@/lib/mockData";

export default function TrackCard({ track, onPlay }: { track: SharedTrack; onPlay: (track: SharedTrack) => void }) {
  const coverUrl = track.coverArtCID
    ? track.coverArtCID.startsWith("http")
      ? track.coverArtCID
      : `https://gateway.pinata.cloud/ipfs/${track.coverArtCID}`
    : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#ff2a5f]/50 transition-all duration-300">
      <div className="aspect-square relative overflow-hidden">
        <img
          src={coverUrl}
          alt={`${track.collection} cover`}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => onPlay(track)}
            className="w-16 h-16 rounded-full bg-[#ff2a5f] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
          >
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <h3 className="font-bold text-lg line-clamp-1">{track.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-1">{track.artists.join(", ")}</p>
          </div>
          <button className="text-gray-500 hover:text-[#ff2a5f] transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-3 line-clamp-1">{track.collection} • {track.type}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1 bg-[#1f1f1f] px-2 py-1 rounded-md">
            <Disc className="w-3 h-3" />
            {track.genre}
          </span>
          <span className="flex items-center gap-1 bg-[#1f1f1f] px-2 py-1 rounded-md">
            <Music2 className="w-3 h-3" />
            {track.playCount.toLocaleString()} plays
          </span>
        </div>
      </div>
    </div>
  );
}
