import { Play, Disc, Heart, DollarSign } from "lucide-react";
import { Track } from "@/types/track";
import Image from "next/image";

export default function TrackCard({ track, onPlay }: { track: Track; onPlay: (track: Track) => void }) {
  const coverUrl = track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";

  const handlePlayClick = () => {
    onPlay(track);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#ff2a5f]/50 transition-all duration-300">
      <div className="aspect-square relative overflow-hidden">
        <Image 
          src={coverUrl} 
          alt={track.title} 
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            onClick={handlePlayClick}
            className="w-16 h-16 rounded-full bg-[#ff2a5f] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 glow-effect z-10"
          >
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          </button>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg line-clamp-1">{track.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-1">{track.artist_name}</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="text-gray-500 hover:text-[#ff2a5f] transition-colors group relative"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const { getWeb3Provider } = await import("@/lib/web3");
                  const { getPaymentContract } = await import("@/lib/contracts");
                  const { ethers } = await import("ethers");
                  const { signer } = await getWeb3Provider();
                  const payment = getPaymentContract(signer);
                  const tx = await payment.tipTrack(BigInt(track.id), { value: ethers.parseEther("0.001") });
                  await tx.wait();
                  alert("Quick tip (0.001 ETH) sent!");
                } catch (err) {
                  console.error(err);
                  alert("Tip failed.");
                }
              }}
            >
              <DollarSign className="w-5 h-5" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                Tip 0.001 ETH
              </span>
            </button>
            <button className="text-gray-500 hover:text-[#ff2a5f] transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1 bg-[#1f1f1f] px-2 py-1 rounded-md">
            <Disc className="w-3 h-3" />
            {track.genre}
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {track.playCount.toString()}
          </span>
        </div>
      </div>
    </div>
  );
}
