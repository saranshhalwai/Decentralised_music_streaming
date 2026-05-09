"use client";

import { useEffect, useState, useCallback } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getConcertManagerContract, CONCERT_MANAGER_ADDRESS } from "@/lib/contracts";
import { Bell, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Provider, Signer } from "ethers";

type Notification = {
  id: number;
  concertId: number;
  buyer: string;
  timestamp: Date;
  read: boolean;
  index: number;
};

interface RawNotification {
  id: bigint;
  concertId: bigint;
  buyer: string;
  timestamp: bigint;
  read: boolean;
}

export default function ArtistNotifications({ artistAddress }: { artistAddress: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadNotifications = async () => {
      if (!artistAddress || artistAddress === "0x0000000000000000000000000000000000000000") {
        setLoading(false);
        return;
      }

      if (CONCERT_MANAGER_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setError("Concert Manager contract not configured.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const provider = getReadOnlyProvider() as unknown as Provider;
        const contract = getConcertManagerContract(provider);
        
        const raw: RawNotification[] = await contract.getNotificationsByArtist(artistAddress);
        
        if (!ignore) {
          const parsed = raw.map((n, index: number) => ({
            id: Number(n.id),
            concertId: Number(n.concertId),
            buyer: n.buyer,
            timestamp: new Date(Number(n.timestamp) * 1000),
            read: n.read,
            index: index
          }));
          setNotifications(parsed.reverse()); // Newest first
        }
      } catch (err) {
        console.error("Failed to load artist notifications", err);
        if (!ignore) {
          setError("Failed to load notifications. Make sure the contract is deployed.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, [artistAddress, refreshKey]);

  const markAsRead = useCallback(async (index: number) => {
    try {
      const { signer } = await getWeb3Provider();
      const contract = getConcertManagerContract(signer as unknown as Signer);
      const tx = await contract.markNotificationAsRead(artistAddress, index);
      await tx.wait();
      setRefreshKey(prev => prev + 1); // Trigger reload
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, [artistAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-[#ff2a5f] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-12 border border-dashed border-[#2a2a2a] rounded-3xl text-center">
        <p className="text-gray-500 text-sm">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className={`p-5 rounded-2xl border transition-all ${n.read ? 'bg-[#0d0d0d] border-[#2a2a2a] opacity-60' : 'bg-[#1a1a1a] border-[#ff2a5f]/30 shadow-lg shadow-[#ff2a5f]/5'}`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className={`p-3 rounded-full ${n.read ? 'bg-gray-800' : 'bg-[#ff2a5f]/20'}`}>
                <Bell className={`w-5 h-5 ${n.read ? 'text-gray-500' : 'text-[#ff2a5f]'}`} />
              </div>
              <div>
                <p className="font-bold text-white">New Ticket Sale!</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {n.timestamp.toLocaleString()}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Concert ID:</span> #{n.concertId}
                  </p>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="text-gray-500">Buyer:</span> 
                    <span className="font-mono bg-black px-2 py-0.5 rounded border border-white/5">{n.buyer.slice(0, 6)}...{n.buyer.slice(-4)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {!n.read && (
              <button 
                onClick={() => markAsRead(n.index)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                title="Mark as read"
              >
                <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-green-400" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
