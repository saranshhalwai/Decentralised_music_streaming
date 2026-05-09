"use client";

import { useState, useEffect, useCallback } from "react";
import { getReadOnlyProvider, getWeb3Provider } from "@/lib/web3";
import { getDisputeResolutionContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { Scale, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

enum DisputeStatus { Open, Resolved, Rejected }

interface Dispute {
  id: bigint;
  trackId: bigint;
  claimant: string;
  respondent: string;
  evidenceCIDClaimant: string;
  evidenceCIDRespondent: string;
  votesFor: bigint;
  votesAgainst: bigint;
  deadline: bigint;
  status: DisputeStatus;
}

export default function DisputePage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const provider = getReadOnlyProvider();
      const disputeResolution = getDisputeResolutionContract(provider);
      
      const count = await disputeResolution.disputeCount();
      const loaded: Dispute[] = [];
      // IDs are 0 to count-1 based on disputeCount++
      for (let i = 0; i < Number(count); i++) {
        try {
          const d = await disputeResolution.disputes(BigInt(i));
          loaded.push({
            id: BigInt(d.id),
            trackId: BigInt(d.trackId),
            claimant: d.claimant,
            respondent: d.respondent,
            evidenceCIDClaimant: d.evidenceCIDClaimant,
            evidenceCIDRespondent: d.evidenceCIDRespondent,
            votesFor: BigInt(d.votesFor),
            votesAgainst: BigInt(d.votesAgainst),
            deadline: BigInt(d.deadline),
            status: Number(d.status) as DisputeStatus
          });
        } catch (err) {
          console.error(`Error loading dispute ${i}`, err);
        }
      }
      setDisputes(loaded.reverse());
    } catch (e) {
      console.error("Error fetching disputes", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDisputes();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDisputes]);

  const handleVote = async (disputeId: bigint, supportClaimant: boolean) => {
    try {
      const { signer } = await getWeb3Provider();
      const disputeResolution = getDisputeResolutionContract(signer);
      
      const tx = await disputeResolution.castVote(disputeId, supportClaimant);
      alert("Vote transaction sent. Waiting for confirmation...");
      await tx.wait();
      alert("Vote successfully cast!");
      fetchDisputes();
    } catch (e) {
      console.error(e);
      alert("Failed to vote. Make sure you have voting weight (BeatTokens).");
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
      alert("Failed to resolve dispute. Ensure the deadline has passed.");
    }
  };

  const safeFormatEther = (value: bigint | undefined | null) => {
    try {
      if (value === undefined || value === null) return "0.0";
      return ethers.formatEther(value);
    } catch (e) {
      console.warn("Formatting error", e);
      return "0.0";
    }
  };

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case DisputeStatus.Open:
        return (
          <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Active
          </span>
        );
      case DisputeStatus.Resolved:
        return (
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Claim Accepted
          </span>
        );
      case DisputeStatus.Rejected:
        return (
          <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Claim Rejected
          </span>
        );
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
          {disputes.map((dispute) => (
            <div key={dispute.id.toString()} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    Dispute #{dispute.id.toString()} (Track #{dispute.trackId.toString()})
                    {getStatusBadge(dispute.status)}
                  </h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-gray-400 text-xs">Claimant: <span className="text-gray-300 font-mono">{dispute.claimant}</span></p>
                    <p className="text-gray-400 text-xs">Respondent: <span className="text-gray-300 font-mono">{dispute.respondent}</span></p>
                  </div>
                </div>
                {dispute.status === DisputeStatus.Open && Number(dispute.deadline) < now && (
                  <button 
                    onClick={() => handleResolve(dispute.id)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200"
                  >
                    Resolve Dispute
                  </button>
                )}
                {dispute.status === DisputeStatus.Open && Number(dispute.deadline) >= now && (
                   <div className="text-right">
                     <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Time Remaining</p>
                     <p className="text-sm text-[#ff2a5f] font-black">
                       {Math.max(0, Math.floor((Number(dispute.deadline) - now) / 3600))}h {Math.max(0, Math.floor(((Number(dispute.deadline) - now) % 3600) / 60))}m left
                     </p>
                   </div>
                )}
              </div>
              
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Claimant Evidence (CID)</p>
                <p className="text-gray-300 font-mono break-all text-sm">{dispute.evidenceCIDClaimant || "No evidence provided."}</p>
                
                {dispute.evidenceCIDRespondent && (
                  <>
                    <hr className="my-3 border-white/5" />
                    <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Respondent Evidence (CID)</p>
                    <p className="text-gray-300 font-mono break-all text-sm">{dispute.evidenceCIDRespondent}</p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
                  <div className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Votes for Respondent</div>
                  <div className="text-2xl font-black text-white mb-4">{safeFormatEther(dispute.votesAgainst)} <span className="text-xs font-normal text-gray-500">BEAT</span></div>
                  {dispute.status === DisputeStatus.Open && Number(dispute.deadline) > now && (
                    <button 
                      onClick={() => handleVote(dispute.id, false)}
                      className="w-full py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm font-bold transition-colors"
                    >
                      Vote for Respondent
                    </button>
                  )}
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
                  <div className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Votes for Claimant</div>
                  <div className="text-2xl font-black text-[#ff2a5f] mb-4">{safeFormatEther(dispute.votesFor)} <span className="text-xs font-normal text-gray-500">BEAT</span></div>
                  {dispute.status === DisputeStatus.Open && Number(dispute.deadline) > now && (
                    <button 
                      onClick={() => handleVote(dispute.id, true)}
                      className="w-full py-2 bg-[#ff2a5f]/20 text-[#ff2a5f] hover:bg-[#ff2a5f]/30 rounded-lg text-sm font-bold border border-[#ff2a5f]/30 transition-colors"
                    >
                      Vote for Claimant
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
