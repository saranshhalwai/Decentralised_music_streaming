export type CollectionType = "Album" | "EP" | "Single";

export interface Track {
  id: string;
  title: string;
  artists: string[];
  genre: string;
  collection: string;
  type: CollectionType;
  coverArtCID?: string;
  src: string;
  playCount: number;
  earnings: number;
  listeners: number;
  engagement: number;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  coverArt: string;
  wallet: string;
  followers: number;
  monthlyListeners: number;
  totalStreams: number;
  totalEarnings: number;
  engagement: number;
}

export const artists: Artist[] = [
  {
    id: "a1",
    name: "Synthwave Master",
    genre: "Synthwave",
    coverArt: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=500&auto=format&fit=crop",
    wallet: "0x12A3...ef45",
    followers: 12000,
    monthlyListeners: 16800,
    totalStreams: 1250,
    totalEarnings: 2.4,
    engagement: 89,
  },
  {
    id: "a2",
    name: "Byte Runner",
    genre: "Electronic",
    coverArt: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=500&auto=format&fit=crop",
    wallet: "0x9B4F...83Dc",
    followers: 8700,
    monthlyListeners: 14200,
    totalStreams: 890,
    totalEarnings: 1.7,
    engagement: 77,
  },
  {
    id: "a3",
    name: "Crypto DJ",
    genre: "Hip Hop",
    coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
    wallet: "0xF2E1...7B9A",
    followers: 21200,
    monthlyListeners: 28900,
    totalStreams: 5250,
    totalEarnings: 4.8,
    engagement: 92,
  },
  {
    id: "a4",
    name: "Chill Nodes",
    genre: "Lofi",
    coverArt: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=500&auto=format&fit=crop",
    wallet: "0x18C4...7221",
    followers: 6400,
    monthlyListeners: 9800,
    totalStreams: 2390,
    totalEarnings: 2.2,
    engagement: 84,
  },
];

export const tracks: Track[] = [
  {
    id: "1",
    title: "Neon Dreams",
    artists: ["Synthwave Master"],
    genre: "Synthwave",
    type: "Single",
    collection: "Neon Skyline",
    coverArtCID: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=500&auto=format&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    playCount: 1250,
    earnings: 1.1,
    listeners: 980,
    engagement: 91,
  },
  {
    id: "2",
    title: "Cyber City Protocol",
    artists: ["Byte Runner"],
    genre: "Electronic",
    type: "Album",
    collection: "Future Circuit",
    coverArtCID: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=500&auto=format&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    playCount: 890,
    earnings: 1.0,
    listeners: 760,
    engagement: 74,
  },
  {
    id: "3",
    title: "Blockchain Beats",
    artists: ["Crypto DJ"],
    genre: "Hip Hop",
    type: "EP",
    collection: "Decentralized Sessions",
    coverArtCID: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    playCount: 3420,
    earnings: 2.5,
    listeners: 2300,
    engagement: 95,
  },
  {
    id: "4",
    title: "Decentralized Lofi",
    artists: ["Chill Nodes"],
    genre: "Lofi",
    type: "Album",
    collection: "Node Vibes",
    coverArtCID: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=500&auto=format&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    playCount: 560,
    earnings: 0.5,
    listeners: 410,
    engagement: 80,
  },
  {
    id: "5",
    title: "Chain Reaction",
    artists: ["Crypto DJ", "Chill Nodes"],
    genre: "Hip Hop",
    type: "Single",
    collection: "Decentralized Sessions",
    coverArtCID: "https://images.unsplash.com/photo-1519861531214-1b4a1adb7cbd?q=80&w=500&auto=format&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    playCount: 1830,
    earnings: 1.2,
    listeners: 1420,
    engagement: 88,
  },
];

export function getArtistById(id: string): Artist | undefined {
  return artists.find((artist) => artist.id === id);
}

export function getTracksByArtist(artistId: string): Track[] {
  const artist = getArtistById(artistId);
  if (!artist) {
    return [];
  }

  return tracks.filter((track) => track.artists.includes(artist.name));
}

export function getCollectionsByArtist(artistId: string) {
  const artistTracks = getTracksByArtist(artistId);
  const collectionMap = new Map<string, { type: CollectionType; streams: number; earnings: number; songs: number }>();

  artistTracks.forEach((track) => {
    const existing = collectionMap.get(track.collection);
    if (existing) {
      existing.streams += track.playCount;
      existing.earnings += track.earnings;
      existing.songs += 1;
    } else {
      collectionMap.set(track.collection, {
        type: track.type,
        streams: track.playCount,
        earnings: track.earnings,
        songs: 1,
      });
    }
  });

  return Array.from(collectionMap.entries()).map(([collection, data]) => ({
    collection,
    ...data,
  }));
}
