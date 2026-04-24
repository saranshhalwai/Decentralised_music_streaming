"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre: string;
  ipfsCID?: string;
  coverArtCID?: string;
  src?: string;
}

interface AudioPlayerContextValue {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);

  const value = useMemo(
    () => ({ currentTrack, setCurrentTrack, isPlaying, setIsPlaying, volume, setVolume }),
    [currentTrack, isPlaying, volume]
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
