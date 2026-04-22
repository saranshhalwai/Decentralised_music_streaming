import Link from "next/link";
import { PlayCircle, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff2a5f]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff7e40]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#ff2a5f] animate-pulse"></span>
            <span className="text-sm font-medium text-gray-300">Web3 Music Revolution</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
            Own Your Music, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2a5f] via-[#ff5e5e] to-[#ff7e40]">
              Empower Artists.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            BeatChain is a decentralized music streaming platform where creators keep 100% of their earnings. No middlemen, no limits. Just pure audio uploaded to IPFS.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore">
              <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] text-white font-bold text-lg hover:scale-105 transition-transform duration-300 glow-effect">
                <PlayCircle className="w-6 h-6" />
                Start Listening
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="px-8 py-4 rounded-full bg-[#141414] border border-[#2a2a2a] text-white font-bold text-lg hover:bg-[#1f1f1f] transition-all duration-300">
                Upload as Artist
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0d0d0d] relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose BeatChain?</h2>
            <p className="text-gray-400">The next generation of music streaming is here.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-[#ff2a5f]" />}
              title="100% Decentralized"
              description="Your music is stored permanently on IPFS and registered on the Ethereum blockchain. No one can take it down."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-[#ff5e5e]" />}
              title="Instant Payments"
              description="Fans can tip you directly in ETH. No waiting 90 days for royalty checks from giant corporations."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-[#ff7e40]" />}
              title="Exclusive NFTs"
              description="Mint exclusive tracks or album art as NFTs for your superfans to collect and trade."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-[#141414] border border-[#2a2a2a] hover:border-[#ff2a5f]/50 transition-colors duration-300 group">
      <div className="w-16 h-16 rounded-2xl bg-[#1f1f1f] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
