"use client";

import { useState, useCallback } from "react";
import { Upload, Music, Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { getWeb3Provider } from "@/lib/web3";
import { getMusicRegistryContract, getMusicNFTMarketplaceContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { EthersError } from "@/types/global.d";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'track' | 'nft'>('track');
  
  // Track Form State
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("Pop");
  
  // NFT Form State
  const [nftFile, setNftFile] = useState<File | null>(null);
  const [nftTitle, setNftTitle] = useState("");
  const [nftPrice, setNftPrice] = useState("0.01");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !cover || !title || !artistName) return;

    try {
      setLoading(true);
      setStatus({ type: 'success', message: "Uploading files to IPFS..." });

      const audioCID = await uploadFileToIPFS(file);
      const coverCID = await uploadFileToIPFS(cover);

      setStatus({ type: 'success', message: "Files pinned! Confirming blockchain transaction..." });

      const { signer } = await getWeb3Provider();
      const contract = getMusicRegistryContract(signer);

      const tx = await contract.uploadTrack(title, artistName, genre, audioCID, coverCID);
      setStatus({ type: 'success', message: "Transaction sent! Waiting for block confirmation..." });
      
      await tx.wait();
      setStatus({ type: 'success', message: "Track successfully published to the decentralized network!" });
      
      // Reset form
      setTitle("");
      setFile(null);
      setCover(null);
    } catch (error: unknown) {
      const err = error as EthersError;
      console.error(err);
      setStatus({ type: 'error', message: err.message || "Failed to upload track" });
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nftFile || !nftTitle || !nftPrice) return;

    try {
      setLoading(true);
      setStatus({ type: 'success', message: "Uploading NFT artwork to IPFS..." });

      const imageCID = await uploadFileToIPFS(nftFile);
      
      // Create metadata JSON
      const metadata = {
        name: nftTitle,
        description: "Official BeatChain Music Collectible",
        image: `ipfs://${imageCID}`,
        attributes: [
          { trait_type: "Type", value: "Music NFT" },
          { trait_type: "Platform", value: "BeatChain" }
        ]
      };
      
      // In a real app, we'd upload this JSON to IPFS too
      // For this prototype, we'll just use the image CID as the URI
      const tokenURI = `ipfs://${imageCID}`;

      setStatus({ type: 'success', message: "Artwork pinned! Requesting Mint & List transaction..." });

      const { signer } = await getWeb3Provider();
      const marketplace = getMusicNFTMarketplaceContract(signer);
      
      const royaltyFee = await marketplace.royaltyFee();
      const priceWei = ethers.parseEther(nftPrice);

      const tx = await marketplace.createToken(tokenURI, priceWei, { value: royaltyFee });
      setStatus({ type: 'success', message: "Minting transaction sent! Almost there..." });
      
      await tx.wait();
      setStatus({ type: 'success', message: `Successfully minted and listed "${nftTitle}" in the marketplace!` });
      
      // Reset form
      setNftTitle("");
      setNftFile(null);
    } catch (error: unknown) {
      const err = error as EthersError;
      console.error(err);
      setStatus({ type: 'error', message: err.message || "Failed to mint NFT" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff2a5f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 text-white">Creator Studio</h1>
          <p className="text-gray-400 mb-10 text-lg">Upload your music or mint exclusive collectibles.</p>

          <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#2a2a2a] mb-10 w-fit">
            <button 
              onClick={() => { setActiveTab('track'); setStatus(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'track' ? 'bg-[#ff2a5f] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <Music className="w-4 h-4" />
              Publish Track
            </button>
            <button 
              onClick={() => { setActiveTab('nft'); setStatus(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'nft' ? 'bg-[#ff2a5f] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Mint NFT
            </button>
          </div>

          {status && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border shadow-lg animate-in fade-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {activeTab === 'track' ? (
            <form onSubmit={handleUploadTrack} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Track Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moonlight Sonata"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-white focus:border-[#ff2a5f] outline-none transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Artist Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Stage Name"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-white focus:border-[#ff2a5f] outline-none transition-colors"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Genre</label>
                <select
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-white focus:border-[#ff2a5f] outline-none transition-colors appearance-none"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  <option>Pop</option>
                  <option>Electronic</option>
                  <option>Hip Hop</option>
                  <option>Rock</option>
                  <option>Classical</option>
                  <option>Jazz</option>
                  <option>Lo-Fi</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 flex items-center gap-2">
                    <Music className="w-4 h-4" /> Audio File (MP3)
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="audio/mp3"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ff2a5f]/10 file:text-[#ff2a5f] hover:file:bg-[#ff2a5f]/20 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Cover Art
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setCover(e.target.files?.[0] || null)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ff2a5f]/10 file:text-[#ff2a5f] hover:file:bg-[#ff2a5f]/20 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#ff2a5f] text-white font-black rounded-2xl shadow-xl shadow-[#ff2a5f]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Publish to Network
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMintNFT} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Collectible Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Genesis Edition #1"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-white focus:border-[#ff2a5f] outline-none transition-colors"
                  value={nftTitle}
                  onChange={(e) => setNftTitle(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> NFT Artwork
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setNftFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ff2a5f]/10 file:text-[#ff2a5f] hover:file:bg-[#ff2a5f]/20 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Listing Price (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 text-white focus:border-[#ff2a5f] outline-none transition-colors"
                    value={nftPrice}
                    onChange={(e) => setNftPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] text-white font-black rounded-2xl shadow-xl shadow-[#ff2a5f]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Mint & List NFT
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">
                Small listing fee (0.0001 ETH) applies
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
