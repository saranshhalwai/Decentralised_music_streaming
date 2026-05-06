"use client";

import { useState, useEffect } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getDisputeResolutionContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { Scale, Loader2, AlertCircle } from "lucide-react";

interface Dispute {
  trackId: bigint;
  challenger: string;
  reason: string;
  votesForChallenger: bigint;
  votesForOriginalOwner: bigint;
  resolved: boolean;
  endTime: bigint;
}

export default function DisputePage() {
  const [disputes, setDisputes] = useState<{ id: bigint, dispute: Dispute }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const provider = getReadOnlyProvider();
      const disputeResolution = getDisputeResolutionContract(provider);
      
      const count = await disputeResolution.disputeCount();
      const loaded: { id: bigint, dispute: Dispute }[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const dispute = await disputeResolution.disputes(BigInt(i));
        loaded.push({ id: BigInt(i), dispute });
      }
      setDisputes(loaded.reverse());
    } catch (e) {
      console.error("Error fetching disputes", e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (disputeId: bigint, voteForChallenger: boolean) => {
    try {
      const { signer } = await getWeb3Provider();
      const disputeResolution = getDisputeResolutionContract(signer);
      
      const tx = await disputeResolution.vote(disputeId, voteForChallenger);
      alert("Vote transaction sent. Waiting for confirmation...");
      await tx.wait();
      alert("Vote successfully cast!");
      fetchDisputes();
    } catch (e) {
      console.error(e);
      alert("Failed to vote.");
    }
  };

  const handleResolve = async (disputeId: bigint) => {
    try {
      const { signer } = await getWeb3Provider();
      const disputeResolution = getDisputeResolutionContract(signer);
      
      const tx = await disputeResolution.resolveDispute(disputeId);
      alert("Resolve transaction sent...");
      await tx.wait();
      alert("Dispute resolved!");
      fetchDisputes();
    } catch (e) {
      console.error(e);
      alert("Failed to resolve dispute.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-12">
        <Scale className="w-10 h-10 text-[#ff2a5f]" />
        <div>
          <h1 className="text-4xl font-black">Dispute Resolution</h1>
          <p className="text-gray-400">Community governance for copyright claims.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#ff2a5f]" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-[#2a2a2a] rounded-3xl">
          <h2 className="text-xl font-bold text-gray-300">No active disputes</h2>
          <p className="text-gray-500 text-sm mt-2">The community is currently at peace.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map(({ id, dispute }) => (
            <div key={id.toString()} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    Dispute #{id.toString()} (Track #{dispute.trackId.toString()})
                    {dispute.resolved ? (
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">Resolved</span>
                    ) : (
                      <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Challenger: {dispute.challenger}</p>
                </div>
                {!dispute.resolved && Number(dispute.endTime) * 1000 < Date.now() && (
                  <button 
                    onClick={() => handleResolve(id)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
              
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-gray-300 italic">"{dispute.reason}"</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
                  <div className="text-sm text-gray-500 mb-2">Original Owner</div>
                  <div className="text-2xl font-black text-white mb-4">{ethers.formatEther(dispute.votesForOriginalOwner)}</div>
                  {!dispute.resolved && (
                    <button 
                      onClick={() => handleVote(id, false)}
                      className="w-full py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm font-bold"
                    >
                      Vote for Owner
                    </button>
                  )}
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
                  <div className="text-sm text-gray-500 mb-2">Challenger</div>
                  <div className="text-2xl font-black text-[#ff2a5f] mb-4">{ethers.formatEther(dispute.votesForChallenger)}</div>
                  {!dispute.resolved && (
                    <button 
                      onClick={() => handleVote(id, true)}
                      className="w-full py-2 bg-[#ff2a5f]/20 text-[#ff2a5f] hover:bg-[#ff2a5f]/30 rounded-lg text-sm font-bold border border-[#ff2a5f]/30"
                    >
                      Vote for Challenger
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
