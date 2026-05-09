"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Playlist } from "@/types/playlist";

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, "id" | "createdAt">>) => void;
  getPlaylist: (id: string) => Playlist | undefined;
  sharePlaylistOnChain: (playlistId: string) => Promise<string>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("beatchain_playlists");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          console.error("Failed to parse playlists");
        }
      }
    }
    return [];
  });
  
  // Initialize isLoaded based on environment
  const [isLoaded] = useState(() => typeof window !== "undefined");

  // Save to localStorage whenever playlists change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("beatchain_playlists", JSON.stringify(playlists));
    }
  }, [playlists, isLoaded]);

  const createPlaylist = (name: string, description?: string) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const addToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (p.trackIds.includes(trackId)) return p;
          return {
            ...p,
            trackIds: [...p.trackIds, trackId],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            trackIds: p.trackIds.filter((id) => id !== trackId),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  };

  const updatePlaylist = (id: string, updates: Partial<Omit<Playlist, "id" | "createdAt">>) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
  };

  const getPlaylist = (id: string) => {
    return playlists.find((p) => p.id === id);
  };

  const sharePlaylistOnChain = async (playlistId: string) => {
    const playlist = getPlaylist(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.trackIds.length === 0) throw new Error("Cannot share an empty playlist");

    try {
      const { getWeb3Provider } = await import("@/lib/web3");
      const { getPlaylistRegistryContract } = await import("@/lib/contracts");
      const { signer } = await getWeb3Provider();
      const registry = getPlaylistRegistryContract(signer);

      const tx = await registry.createPlaylist(
        playlist.name,
        playlist.description || "",
        playlist.trackIds.map(id => BigInt(id))
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error("Failed to share playlist on-chain", err);
      throw err;
    }
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
        updatePlaylist,
        getPlaylist,
        sharePlaylistOnChain,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error("usePlaylists must be used within a PlaylistProvider");
  }
  return context;
}
