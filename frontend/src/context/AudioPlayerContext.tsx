"use client";

import { createContext, ReactNode, useContext, useMemo, useRef, useState, useCallback } from "react";
import { Track } from "@/types/track";

interface AudioPlayerContextValue {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  queue: Track[];
  setQueue: (tracks: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (track: Track) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [queue, setQueue] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNext = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      // Loop back to start or stop
      // For now, let's just stop
      setIsPlaying(false);
    }
  }, [queue, currentTrack]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
      setIsPlaying(true);
    }
  }, [queue, currentTrack]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      if (prev.find(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const value = useMemo(
    () => ({ 
      currentTrack, 
      setCurrentTrack, 
      isPlaying, 
      setIsPlaying, 
      volume, 
      setVolume, 
      audioRef,
      queue,
      setQueue,
      playNext,
      playPrevious,
      addToQueue
    }),
    [currentTrack, isPlaying, volume, audioRef, queue, playNext, playPrevious, addToQueue]
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
