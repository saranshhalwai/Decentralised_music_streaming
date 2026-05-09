"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReadOnlyProvider } from "@/lib/web3";
import { getConcertManagerContract } from "@/lib/contracts";
import { ethers } from "ethers";

type Concert = {
  id: number;
  title: string;
  date: Date;
  location: string;
  price: string;
  totalTickets: number;
  ticketsSold: number;
  baseURI: string;
};

export default function ConcertList({ onSelect }: { onSelect?: (id: number) => void }) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        setLoading(true);
        const provider = getReadOnlyProvider();
        const contract = getConcertManagerContract(provider as any);
        const total = await contract.totalConcerts();
        const n = Number(total?.toString?.() ?? total);

        const list: Concert[] = [];
        for (let i = 1; i <= n; i++) {
          try {
            const c = await contract.getConcert(i);
            list.push({
              id: Number(c.id.toString()),
              title: c.title,
              date: new Date(Number(c.date.toString()) * 1000),
              location: c.location,
              price: ethers.formatEther(c.price),
              totalTickets: Number(c.totalTickets.toString()),
              ticketsSold: Number(c.ticketsSold.toString()),
              baseURI: c.baseURI,
            });
          } catch (err) {
            console.error(`Error fetching concert ${i}:`, err);
          }
        }

        setConcerts(list);
      } catch (err) {
        console.error("Error loading concerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, []);

  if (loading) return <p>Loading concerts...</p>;
  if (concerts.length === 0) return <p className="text-gray-400">No concerts found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {concerts.map(c => (
        <div key={c.id} className="p-4 border rounded-lg bg-[#0b0b0b]">
          <h3 className="text-lg font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-400">{c.location} • {c.date.toLocaleString()}</p>
          <p className="mt-2">Tickets: {c.ticketsSold}/{c.totalTickets}</p>
          <p className="mt-1">Price: {c.price} ETH</p>
          <div className="mt-3 flex gap-3">
            {onSelect ? (
              <button onClick={() => onSelect(c.id)} className="px-4 py-2 bg-[#ff2a5f] rounded-full text-black font-bold">Select</button>
            ) : (
              <Link href={`/concerts/${c.id}`} className="px-4 py-2 bg-[#ff2a5f] rounded-full text-black font-bold">View</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
