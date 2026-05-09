"use client";

import { useState } from "react";
import { X, Plus, Music } from "lucide-react";
import { usePlaylists } from "@/context/PlaylistContext";
import { Track } from "@/types/track";
import Image from "next/image";

interface AddToPlaylistModalProps {
  track: Track;
  onClose: () => void;
}

export default function AddToPlaylistModal({ track, onClose }: AddToPlaylistModalProps) {
  const { playlists, createPlaylist, addToPlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      const p = createPlaylist(newName.trim());
      addToPlaylist(p.id, track.id);
      onClose();
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, track.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-gradient-to-r from-[#1a1a1a] to-[#141414]">
          <h3 className="font-bold text-xl">Add to Playlist</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {showCreate ? (
            <form onSubmit={handleCreate} className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Playlist Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My awesome playlist"
                  className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f]/50 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2a2a] hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#ff2a5f] hover:bg-[#ff2a5f]/90 transition-colors font-bold shadow-lg shadow-[#ff2a5f]/20"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-[#2a2a2a] hover:border-[#ff2a5f]/50 hover:bg-[#ff2a5f]/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#ff2a5f]/20 transition-colors">
                  <Plus className="w-6 h-6 text-[#ff2a5f]" />
                </div>
                <span className="font-bold text-gray-300 group-hover:text-white">Create New Playlist</span>
              </button>

              <div className="mt-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your Playlists</p>
                {playlists.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                    <Music className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No playlists yet. Create your first one!</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {playlists.map((p) => {
                      const isTrackIn = p.trackIds.includes(track.id);
                      return (
                        <button
                          key={p.id}
                          disabled={isTrackIn}
                          onClick={() => handleAddToPlaylist(p.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                            isTrackIn 
                            ? "bg-[#1a1a1a] opacity-50 cursor-not-allowed" 
                            : "hover:bg-white/5 active:scale-[0.98]"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center overflow-hidden relative">
                            {p.coverUrl ? (
                              <Image src={p.coverUrl} alt={p.name} fill className="object-cover" />
                            ) : (
                              <Music className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-bold line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.trackIds.length} tracks</p>
                          </div>
                          {isTrackIn && (
                            <span className="text-[10px] font-bold text-[#ff2a5f] bg-[#ff2a5f]/10 px-2 py-1 rounded-full">
                              Already in
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
