"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Music, Image as ImageIcon, AlertCircle, Users, Percent, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { getWeb3Provider } from "@/lib/web3";
import { getMusicRegistryContract, getSharedOwnershipContract } from "@/lib/contracts";

interface Shareholder {
  address: string;
  share: string; // in percentage
}

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");

  // Shared Ownership state
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [isSettingShares, setIsSettingShares] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [myTracks, setMyTracks] = useState<{id: string, title: string}[]>([]);

  const fetchMyTracks = useCallback(async () => {
    try {
      const { provider, signer } = await getWeb3Provider();
      const address = await signer.getAddress();
      const registry = getMusicRegistryContract(provider);
      const tracks = await registry.getTracksByArtist(address);
      setMyTracks(tracks.map((t: any) => ({ id: t.id.toString(), title: t.title })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchMyTracks();
  }, [fetchMyTracks]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !coverFile || !title || !artistName || !genre) {
      setStatus("Please fill all fields and select both files.");
      return;
    }

    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("MetaMask is not installed. Please install it to upload tracks.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading to IPFS...");

    try {
      const coverCid = await uploadFileToIPFS(coverFile);
      setStatus("Cover art uploaded! Uploading audio...");

      const audioCid = await uploadFileToIPFS(audioFile);
      setStatus("Files uploaded to IPFS! Registering on Blockchain...");

      const { signer } = await getWeb3Provider();
      const registry = getMusicRegistryContract(signer);

      const populated = await registry.uploadTrack.populateTransaction(
        title, artistName, genre, audioCid, coverCid
      );
      const tx = await signer.sendTransaction(populated);
      setStatus("Transaction pending... Please wait.");
      await tx.wait();

      setStatus("Success! Track has been published to BeatChain.");
      setIsUploading(false);
      setTitle("");
      setArtistName("");
      setGenre("");
      setAudioFile(null);
      setCoverFile(null);
      fetchMyTracks();

    } catch (error: unknown) {
      console.error(error);
      const err = error as { reason?: string; message?: string; code?: string };
      if (err.code === "ACTION_REJECTED") {
        setStatus("Transaction rejected by user.");
      } else {
        setStatus(err.reason || err.message || "An error occurred during upload.");
      }
      setIsUploading(false);
    }
  };

  const addShareholder = () => {
    setShareholders([...shareholders, { address: "", share: "" }]);
  };

  const removeShareholder = (index: number) => {
    setShareholders(shareholders.filter((_, i) => i !== index));
  };

  const updateShareholder = (index: number, field: keyof Shareholder, value: string) => {
    const updated = [...shareholders];
    updated[index][field] = value;
    setShareholders(updated);
  };

  const handleSetShares = async () => {
    if (!selectedTrackId || shareholders.length === 0) {
      setShareStatus("Select a track and add at least one shareholder.");
      return;
    }

    const total = shareholders.reduce((acc, s) => acc + (parseFloat(s.share) || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      setShareStatus(`Total share must be exactly 100%. Current: ${total}%`);
      return;
    }

    try {
      setIsSettingShares(true);
      setShareStatus("Configuring revenue splits...");
      const { signer } = await getWeb3Provider();
      const sharedOwnership = getSharedOwnershipContract(signer);

      const addresses = shareholders.map(s => s.address);
      const basisPoints = shareholders.map(s => Math.round(parseFloat(s.share) * 100));

      const tx = await sharedOwnership.setShares(BigInt(selectedTrackId), addresses, basisPoints);
      await tx.wait();

      setShareStatus("Success! Revenue splits configured.");
      setShareholders([]);
      setSelectedTrackId("");
    } catch (e: any) {
      console.error(e);
      setShareStatus(e.reason || e.message || "Failed to set shares.");
    } finally {
      setIsSettingShares(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2 tracking-tight">Artist Hub</h1>
        <p className="text-gray-400">Manage your music, royalties, and revenue splits.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Upload Form */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Upload className="w-6 h-6 text-[#ff2a5f]" />
            <h2 className="text-xl font-bold">Publish New Track</h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider text-[10px]">Track Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f] transition-colors text-sm"
                  placeholder="e.g. Neon Dreams"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider text-[10px]">Artist Name</label>
                <input 
                  type="text" 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f] transition-colors text-sm"
                  placeholder="e.g. DJ Ether"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 uppercase tracking-wider text-[10px]">Genre</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f] transition-colors text-white text-sm"
              >
                <option value="">Select Genre</option>
                <option value="Electronic">Electronic</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Synthwave">Synthwave</option>
                <option value="Lofi">Lofi</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ff2a5f]/30 transition-colors cursor-pointer relative group">
                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Music className="w-8 h-8 text-[#ff2a5f] mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-300">{audioFile ? audioFile.name : "Select Audio"}</p>
              </div>
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ff7e40]/30 transition-colors cursor-pointer relative group">
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <ImageIcon className="w-8 h-8 text-[#ff7e40] mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-300">{coverFile ? coverFile.name : "Select Cover"}</p>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-xs ${status.includes('Success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#1f1f1f] border border-[#2a2a2a]'}`}>
                <AlertCircle className="w-4 h-4" />
                <span>{status}</span>
              </div>
            )}

            <button type="submit" disabled={isUploading} className="w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Publish to Network
            </button>
          </form>
        </div>

        {/* Revenue Splits Section */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-[#ff7e40]" />
            <h2 className="text-xl font-bold">Shared Ownership</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 uppercase tracking-wider text-[10px]">Select Track</label>
              <select 
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm"
              >
                <option value="">Choose a track...</option>
                {myTracks.map(t => <option key={t.id} value={t.id}>{t.title} (#{t.id})</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Revenue Splits</label>
                <button onClick={addShareholder} className="text-xs text-[#ff2a5f] font-bold flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> Add Partner
                </button>
              </div>

              {shareholders.map((s, i) => (
                <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                  <input 
                    type="text"
                    value={s.address}
                    onChange={(e) => updateShareholder(i, 'address', e.target.value)}
                    placeholder="Wallet Address"
                    className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-2 text-xs"
                  />
                  <div className="relative w-24">
                    <input 
                      type="number"
                      value={s.share}
                      onChange={(e) => updateShareholder(i, 'share', e.target.value)}
                      placeholder="%"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-2 text-xs pr-8"
                    />
                    <Percent className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                  <button onClick={() => removeShareholder(i)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {shareholders.length === 0 && (
                <div className="py-8 border border-dashed border-[#2a2a2a] rounded-2xl text-center">
                  <p className="text-xs text-gray-500">No partners added yet.</p>
                </div>
              )}
            </div>

            {shareStatus && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-xs ${shareStatus.includes('Success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <AlertCircle className="w-4 h-4" />
                <span>{shareStatus}</span>
              </div>
            )}

            <button 
              onClick={handleSetShares}
              disabled={isSettingShares}
              className="w-full py-4 rounded-xl font-bold bg-[#ff7e40] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isSettingShares ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Set Revenue Splits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
