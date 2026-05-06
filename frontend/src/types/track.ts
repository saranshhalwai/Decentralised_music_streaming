export interface Track {
  id: string;
  title: string;
  artist_name: string;
  artist_address: string;
  genre: string;
  ipfsCID: string;
  coverArtCID: string;
  src: string;
  coverUrl: string;
  playCount: number | bigint;
  timestamp?: bigint;
}
