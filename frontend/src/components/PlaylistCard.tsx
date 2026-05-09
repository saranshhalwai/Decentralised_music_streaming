"use client";

import { Music, Play, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description: string;
    creator: string;
    trackCount: number;
    timestamp: number;
  };
  onPlay?: () => void;
}

export default function PlaylistCard({ playlist, onPlay }: PlaylistCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#3b82f6]/50 transition-all duration-300 shadow-xl">
      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
        <div className="p-8 rounded-2xl bg-white/5 group-hover:bg-[#3b82f6]/10 transition-colors duration-500">
          <Music className="w-12 h-12 text-gray-500 group-hover:text-[#3b82f6] transition-colors" />
        </div>
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-10">
          {onPlay && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPlay();
              }}
              className="w-14 h-14 rounded-full bg-[#3b82f6] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
            >
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            </button>
          )}
          <Link 
            href={`/explore/playlists/${playlist.id}`}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 transition-transform duration-300"
          >
            <ExternalLink className="w-6 h-6" />
          </Link>
        </div>

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
          {playlist.trackCount} Tracks
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-[#3b82f6] transition-colors">{playlist.name}</h3>
        <p className="text-gray-400 text-xs line-clamp-1 mb-4">by {playlist.creator.slice(0, 6)}...{playlist.creator.slice(-4)}</p>
        
        <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 pt-4 border-t border-[#2a2a2a]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(playlist.timestamp)}
          </span>
          <span className="text-[#3b82f6] font-bold">On-Chain</span>
        </div>
      </div>
    </div>
  );
}
