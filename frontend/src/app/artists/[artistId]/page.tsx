import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Users, Music2, BarChart3 } from "lucide-react";
import { artists, getArtistById, getTracksByArtist, getCollectionsByArtist } from "@/lib/mockData";

export function generateStaticParams() {
  return artists.map((artist) => ({ artistId: artist.id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params;
  const artist = getArtistById(artistId);

  if (!artist) {
    notFound();
  }

  const tracks = getTracksByArtist(artistId);
  const collections = getCollectionsByArtist(artistId);

  return (
    <div className="min-h-screen bg-[#040404] text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <Link href="/artists" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to artists
        </Link>

        <div className="rounded-3xl bg-[#141414] border border-[#2a2a2a] p-8 mb-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-end">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10">
              <img src={artist.coverArt} alt={artist.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.3em] text-[#ff7e40] mb-3">Artist profile</p>
              <h1 className="text-5xl font-bold mb-4">{artist.name}</h1>
              <p className="text-gray-400 text-lg max-w-3xl">{artist.name} is a decentralized music creator with a focus on {artist.genre}. Track engagement, collections, and earnings all live on-chain.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full sm:w-auto">
              <div className="rounded-3xl bg-[#0f0f0f] border border-[#2a2a2a] p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Wallet</p>
                <p className="mt-2 font-semibold text-white">{artist.wallet}</p>
              </div>
              <div className="rounded-3xl bg-[#0f0f0f] border border-[#2a2a2a] p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Followers</p>
                <p className="mt-2 font-semibold text-white">{artist.followers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 mb-10">
          <SummaryCard icon={<BarChart3 className="w-5 h-5" />} label="Total Streams" value={artist.totalStreams.toLocaleString()} />
          <SummaryCard icon={<Sparkles className="w-5 h-5" />} label="Total Earnings" value={`$${artist.totalEarnings.toFixed(2)}k`} />
          <SummaryCard icon={<Users className="w-5 h-5" />} label="Monthly Listeners" value={artist.monthlyListeners.toLocaleString()} />
          <SummaryCard icon={<Music2 className="w-5 h-5" />} label="Engagement" value={`${artist.engagement}%`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          <div className="rounded-3xl bg-[#141414] border border-[#2a2a2a] p-8">
            <h2 className="text-2xl font-bold mb-4">Song Performance</h2>
            <div className="space-y-4">
              {tracks.map((track) => (
                <div key={track.id} className="rounded-3xl bg-[#0f0f0f] p-5 border border-[#222]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mb-2">{track.collection} • {track.type}</p>
                      <h3 className="text-xl font-semibold">{track.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">Artists: {track.artists.join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Streams</p>
                      <p className="text-lg font-semibold">{track.playCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div className="rounded-2xl bg-[#121212] p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Earnings</p>
                      <p className="mt-1 text-white font-semibold">${track.earnings.toFixed(2)}k</p>
                    </div>
                    <div className="rounded-2xl bg-[#121212] p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Engagement</p>
                      <p className="mt-1 text-white font-semibold">{track.engagement}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#141414] border border-[#2a2a2a] p-8">
            <h2 className="text-2xl font-bold mb-4">Collection Breakdown</h2>
            <div className="space-y-4">
              {collections.map((collection) => (
                <div key={collection.collection} className="rounded-3xl bg-[#0f0f0f] border border-[#222] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">{collection.type}</p>
                      <h3 className="text-xl font-semibold">{collection.collection}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Songs</p>
                      <p className="text-lg font-semibold">{collection.songs}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div className="rounded-2xl bg-[#121212] p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Streams</p>
                      <p className="mt-1 text-white font-semibold">{collection.streams.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-[#121212] p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Earnings</p>
                      <p className="mt-1 text-white font-semibold">${collection.earnings.toFixed(2)}k</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[#141414] border border-[#2a2a2a] p-6">
      <div className="flex items-center gap-3 text-gray-400 mb-4">{icon}<span className="text-sm uppercase tracking-[0.2em]">{label}</span></div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
