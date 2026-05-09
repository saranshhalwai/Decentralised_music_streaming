"use client";

import { useEffect, useState } from "react";
import { getReadOnlyProvider } from "@/lib/web3";
import { getConcertManagerContract } from "@/lib/contracts";

export default function ArtistNotifications({ artistAddress }: { artistAddress: string }) {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!artistAddress) return;
    let cancelled = false;

    const load = async () => {
      try {
        const provider = getReadOnlyProvider();
        const contract = getConcertManagerContract(provider as any);
        const raw = await contract.getNotificationsByArtist(artistAddress);
        const parsed = raw.map((n: any) => ({
          id: Number(n.id.toString()),
          concertId: Number(n.concertId.toString()),
          message: n.message,
          timestamp: Number(n.timestamp.toString()),
        }));
        if (!cancelled) setNotes(parsed);
      } catch (e) {
        console.error("Failed to load artist notifications", e);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [artistAddress]);

  if (!notes || notes.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold mb-2">Artist Notifications</h4>
      <ul className="space-y-2">
        {notes.map(n => (
          <li key={n.id} className="bg-[#0b0b0b] p-3 rounded-lg border border-[#1f1f1f] text-sm">
            <div className="text-gray-300">{n.message}</div>
            <div className="text-xs text-gray-500 mt-1">Concert #{n.concertId} • {new Date(n.timestamp * 1000).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
