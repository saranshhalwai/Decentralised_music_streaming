"use client";

import { useEffect, useState } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getConcertManagerContract } from "@/lib/contracts";
import { ethers } from "ethers";

export default function ConcertDetail({ concertId }: { concertId: number }) {
  const [concert, setConcert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const provider = getReadOnlyProvider();
        const contract = getConcertManagerContract(provider as any);
        const c = await contract.getConcert(concertId);
        setConcert({
          id: Number(c.id.toString()),
          title: c.title,
          date: new Date(Number(c.date.toString()) * 1000),
          location: c.location,
          priceWei: c.price.toString(),
          price: ethers.formatEther(c.price),
          totalTickets: Number(c.totalTickets.toString()),
          ticketsSold: Number(c.ticketsSold.toString()),
          baseURI: c.baseURI,
        });
      } catch (err) {
        console.error("Error loading concert:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [concertId]);

  const buyTicket = async () => {
    if (!concert) return;
    try {
      setBuying(true);
      setMessage(null);
      const { provider, signer } = await getWeb3Provider();
      const contract = getConcertManagerContract(signer as any);
      const tx = await contract.buyTicket(concert.id, { value: concert.priceWei });
      setMessage("Waiting for transaction...");
      await tx.wait();
      setMessage("Ticket purchased successfully!");

      // reload concert info
      const ro = getReadOnlyProvider();
      const roContract = getConcertManagerContract(ro as any);
      const c2 = await roContract.getConcert(concertId);
      setConcert({
        id: Number(c2.id.toString()),
        title: c2.title,
        date: new Date(Number(c2.date.toString()) * 1000),
        location: c2.location,
        priceWei: c2.price.toString(),
        price: ethers.formatEther(c2.price),
        totalTickets: Number(c2.totalTickets.toString()),
        ticketsSold: Number(c2.ticketsSold.toString()),
        baseURI: c2.baseURI,
      });
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || String(err));
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <p>Loading concert...</p>;
  if (!concert) return <p className="text-gray-400">Concert not found.</p>;

  return (
    <div className="p-6 bg-[#0b0b0b] rounded-lg border">
      <h2 className="text-2xl font-bold">{concert.title}</h2>
      <p className="text-sm text-gray-400">{concert.location} • {concert.date.toLocaleString()}</p>
      <p className="mt-3">Tickets sold: {concert.ticketsSold}/{concert.totalTickets}</p>
      <p className="mt-1">Price: {concert.price} ETH</p>

      <div className="mt-4">
        <button onClick={buyTicket} disabled={buying || concert.ticketsSold >= concert.totalTickets} className="px-4 py-2 bg-[#ff2a5f] rounded-full text-black font-bold">
          {concert.ticketsSold >= concert.totalTickets ? "Sold Out" : buying ? "Buying..." : `Buy Ticket - ${concert.price} ETH`}
        </button>
      </div>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
