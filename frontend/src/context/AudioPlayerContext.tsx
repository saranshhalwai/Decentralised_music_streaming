"use client";

import { createContext, ReactNode, useContext, useMemo, useRef, useState } from "react";
import { Track } from "@/types/track";

interface AudioPlayerContextValue {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const value = useMemo(
    () => ({ currentTrack, setCurrentTrack, isPlaying, setIsPlaying, volume, setVolume, audioRef }),
    [currentTrack, isPlaying, volume, audioRef]
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
