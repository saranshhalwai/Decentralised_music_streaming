"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from "lucide-react";
import { useState } from "react";

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="fixed bottom-0 w-full glass-panel border-t border-white/10 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] rounded-md shadow-lg flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-white opacity-50">Cover</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">Track Name</h4>
            <p className="text-xs text-gray-400">Artist</p>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-xl">
          <div className="flex items-center gap-6 mb-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          
          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">1:24</span>
            <div className="h-1 bg-[#2a2a2a] rounded-full flex-1 relative cursor-pointer group">
              <div className="absolute top-0 left-0 h-full bg-[#ff2a5f] w-1/3 rounded-full group-hover:bg-[#ff7e40] transition-colors"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">3:45</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/4 text-gray-400">
          <Volume2 className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          <div className="w-24 h-1 bg-[#2a2a2a] rounded-full cursor-pointer relative group hidden md:block">
            <div className="absolute top-0 left-0 h-full bg-white w-2/3 rounded-full"></div>
          </div>
          <Maximize2 className="w-4 h-4 hover:text-white cursor-pointer transition-colors ml-2" />
        </div>
      </div>
    </div>
  );
}
