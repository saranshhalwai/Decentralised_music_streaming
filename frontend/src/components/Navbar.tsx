"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Music, Wallet, Home, Compass, User, LayoutDashboard, ShoppingCart, Scale } from "lucide-react";
import { getWeb3Provider, formatAddress } from "@/lib/web3";

export default function Navbar() {
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }

        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            setAddress("");
          }
        });

        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    };
    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      const { signer } = await getWeb3Provider();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] glow-effect">
                <Music className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gradient">BeatChain</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/" icon={<Home className="w-4 h-4" />} text="Home" />
              <NavLink href="/explore" icon={<Compass className="w-4 h-4" />} text="Explore" />
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} text="Artist" />
              <NavLink href="/marketplace" icon={<ShoppingCart className="w-4 h-4" />} text="Marketplace" />
              <NavLink href="/dispute" icon={<Scale className="w-4 h-4" />} text="Disputes" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {address ? (
              <Link href="/profile">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-all duration-300">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">{formatAddress(address)}</span>
                </button>
              </Link>
            ) : (
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] hover:opacity-90 transition-all duration-300 font-medium text-sm text-white glow-effect"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium">
      {icon}
      {text}
    </Link>
  );
}
