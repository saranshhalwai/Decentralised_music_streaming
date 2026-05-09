"use client";

import { usePlaylists } from "@/context/PlaylistContext";
import { Music, Plus, Trash2, ChevronRight, Clock, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function PlaylistsPage() {
  const { playlists, deletePlaylist, createPlaylist } = usePlaylists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      createPlaylist(newName.trim(), newDesc.trim());
      setNewName("");
      setNewDesc("");
      setShowCreateModal(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Your Playlists</h1>
          <p className="text-gray-400">Manage your custom collections and music journeys.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff2a5f] hover:bg-[#ff2a5f]/90 transition-all duration-300 font-bold shadow-lg shadow-[#ff2a5f]/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#141414] rounded-3xl border border-[#2a2a2a] border-dashed">
          <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
            <Music className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No playlists yet</h2>
          <p className="text-gray-400 text-center max-w-md mb-8">
            Start organizing your favorite tracks into custom playlists. Add tracks from the Explore page or your Profile.
          </p>
          <Link href="/explore">
            <button className="px-8 py-3 rounded-xl border border-[#2a2a2a] hover:bg-white/5 transition-all duration-300 font-bold">
              Explore Music
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id}
              className="group relative bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#ff2a5f]/50 transition-all duration-300 shadow-xl"
            >
              <Link href={`/playlists/${playlist.id}`} className="block">
                <div className="aspect-video relative bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center overflow-hidden">
                  {playlist.coverUrl ? (
                    <Image 
                      src={playlist.coverUrl} 
                      alt={playlist.name} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="p-8 rounded-2xl bg-white/5 group-hover:bg-[#ff2a5f]/10 transition-colors duration-500">
                      <Music className="w-12 h-12 text-gray-500 group-hover:text-[#ff2a5f] transition-colors" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 z-10">
                    {playlist.trackIds.length} Tracks
                  </div>
                </div>
              </Link>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Link href={`/playlists/${playlist.id}`} className="flex-1">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-[#ff2a5f] transition-colors line-clamp-1">{playlist.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{playlist.description || "No description"}</p>
                  </Link>
                  <button 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this playlist?")) {
                        deletePlaylist(playlist.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-[#2a2a2a]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {formatDate(playlist.updatedAt)}
                  </span>
                  <Link href={`/playlists/${playlist.id}`} className="flex items-center gap-1 text-[#ff2a5f] font-bold hover:underline">
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-gradient-to-r from-[#1a1a1a] to-[#141414]">
              <h3 className="font-bold text-xl">Create New Playlist</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Playlist Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My awesome playlist"
                  required
                  className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f]/50 transition-colors text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's this collection about?"
                  className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f]/50 transition-colors text-white h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2a2a] hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#ff2a5f] hover:bg-[#ff2a5f]/90 transition-colors font-bold shadow-lg shadow-[#ff2a5f]/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
