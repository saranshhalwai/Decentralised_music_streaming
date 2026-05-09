"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { User, Wallet, Music, TrendingUp, Download, Loader2, AlertCircle, CheckCircle2, Award, Tag } from "lucide-react";
import { getWeb3Provider, formatAddress } from "@/lib/web3";
import { getMusicRegistryContract, getPaymentContract, getMusicNFTContract, getMarketplaceContract, MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { ethers } from "ethers";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import TrackCard from "@/components/TrackCard";
import { Track } from "@/types/track";
import { getIPFSUrl } from "@/lib/ipfs";
import Image from "next/image";

interface RawTrack {
  id: bigint;
  artist: string;
  title: string;
  artistName: string;
  genre: string;
  ipfsCID: string;
  coverArtCID: string;
  timestamp: bigint;
  playCount: bigint;
  exists: boolean;
}

interface OwnedNFT {
  tokenId: bigint;
  trackId: bigint;
  creator: string;
  metadataURI: string;
  trackTitle?: string;
  coverUrl?: string;
}

export default function Profile() {
  const [address, setAddress] = useState<string>("Not Connected");
  const [balance, setBalance] = useState<string>("0.00");
  const [earnings, setEarnings] = useState<string>("0.00");
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [ownedNFTs, setOwnedNfts] = useState<OwnedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const { setCurrentTrack, setIsPlaying } = useAudioPlayer();
  const hasFetched = useRef(false);

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { provider, signer } = await getWeb3Provider();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
      
      const userBalance = await provider.getBalance(userAddress);
      setBalance(ethers.formatEther(userBalance).substring(0, 6));

      // Fetch Artist Earnings
      try {
        const paymentContract = getPaymentContract(provider);
        const artistEarnings = await paymentContract.earningsOf(userAddress);
        setEarnings(ethers.formatEther(artistEarnings));
      } catch {
        setEarnings("0.0");
      }

      // Fetch Owned NFTs
      try {
        const nftContract = getMusicNFTContract(provider);
        const registryContract = getMusicRegistryContract(provider);
        const totalMinted = await nftContract.totalMinted();
        const nfts: OwnedNFT[] = [];
        
        for (let i = 0; i < Number(totalMinted); i++) {
          try {
            const owner = await nftContract.ownerOf(BigInt(i));
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              const data = await nftContract.getCollectible(BigInt(i));
              const track = await registryContract.getTrack(data.trackId);
              nfts.push({
                tokenId: data.tokenId,
                trackId: data.trackId,
                creator: data.creator,
                metadataURI: data.metadataURI,
                trackTitle: track.title,
                coverUrl: getIPFSUrl(track.coverArtCID)
              });
            }
          } catch (e) {
            console.error(`Error fetching NFT ${i}`, e);
          }
        }
        setOwnedNfts(nfts);
      } catch (e) {
        console.error("NFT fetch failed", e);
      }

      // Fetch Artist Tracks
      const registryContract = getMusicRegistryContract(provider);
      const rawTracks: RawTrack[] = await registryContract.getTracksByArtist(userAddress);
      
      const formattedTracks: Track[] = rawTracks.map((t) => ({
        id: t.id.toString(),
        title: t.title,
        artist_name: t.artistName,
        genre: t.genre,
        ipfsCID: t.ipfsCID,
        coverArtCID: t.coverArtCID,
        artist_address: t.artist,
        playCount: t.playCount,
        src: getIPFSUrl(t.ipfsCID) || "",
        coverUrl: getIPFSUrl(t.coverArtCID) || ""
      }));

      setArtistTracks(formattedTracks);
    } catch (err) {
      console.error("Could not fetch profile info", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchProfileData();
    }
  }, [fetchProfileData]);

  const handleWithdraw = async () => {
    if (ethers.parseEther(earnings) === 0n) return;
    try {
      setIsWithdrawing(true);
      setTxStatus(null);
      const { signer } = await getWeb3Provider();
      const paymentContract = getPaymentContract(signer);
      const tx = await paymentContract.withdrawEarnings();
      setTxStatus({ type: 'success', message: 'Withdrawal transaction sent...' });
      await tx.wait();
      setTxStatus({ type: 'success', message: 'Earnings successfully withdrawn!' });
      fetchProfileData();
    } catch (err: unknown) {
      const error = err as Error;
      setTxStatus({ type: 'error', message: error.message || 'Withdrawal failed.' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleListNFT = async (tokenId: bigint) => {
    const price = prompt("Enter listing price in ETH (e.g. 0.01):");
    if (!price || isNaN(parseFloat(price))) return;

    try {
      setTxStatus({ type: 'success', message: "Approving Marketplace..." });
      const { signer } = await getWeb3Provider();
      const nftContract = getMusicNFTContract(signer);
      const marketplace = getMarketplaceContract(signer);

      // 1. Approve marketplace
      const approveTx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
      await approveTx.wait();

      // 2. List
      setTxStatus({ type: 'success', message: "Listing NFT..." });
      const listTx = await marketplace.listNFT(tokenId, ethers.parseEther(price));
      await listTx.wait();

      setTxStatus({ type: 'success', message: `NFT #${tokenId} listed for ${price} ETH!` });
      fetchProfileData();
    } catch (err: unknown) {
      console.error(err);
      setTxStatus({ type: 'error', message: "Listing failed." });
    }
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#ff2a5f] animate-spin" />
        <p className="text-gray-400 animate-pulse">Loading your Web3 profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Card */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ff2a5f]/10 to-[#ff7e40]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#ff2a5f] to-[#ff7e40] p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
               <User className="w-12 h-12 text-gray-500" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-white mb-2">{artistTracks.length > 0 ? "Artist Dashboard" : "Collector Profile"}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm">
                <Wallet className="w-4 h-4 text-[#ff2a5f]" />
                <span className="font-mono text-gray-300">{formatAddress(address)}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm">
                <span className="text-gray-500">Balance:</span>
                <span className="text-[#ff7e40] font-bold">{balance} ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {txStatus && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border shadow-lg ${txStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {txStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{txStatus.message}</p>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Earnings Card */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-400">
              <TrendingUp className="text-[#ff2a5f] w-5 h-5" /> Claimable Earnings
            </h2>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">{parseFloat(earnings).toFixed(4)}</span>
              <span className="text-lg font-bold text-gray-500 ml-2">ETH</span>
            </div>
            <button 
              disabled={ethers.parseEther(earnings) === 0n || isWithdrawing}
              onClick={handleWithdraw}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold bg-[#ff2a5f] text-white disabled:opacity-50 transition-all"
            >
              {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Withdraw to Wallet
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8">
            <h2 className="text-lg font-bold mb-6 text-gray-300">Platform Stats</h2>
            <div className="space-y-6">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Tracks Uploaded</span>
                 <span className="text-white font-bold">{artistTracks.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Collectibles Owned</span>
                 <span className="text-white font-bold">{ownedNFTs.length} NFTs</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-12">
          {/* NFT Gallery */}
          <section>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
              <Award className="text-[#ff2a5f] w-6 h-6" /> Your Collectibles
            </h2>
            {ownedNFTs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {ownedNFTs.map((nft) => (
                  <div key={nft.tokenId.toString()} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden group">
                    <div className="aspect-square relative">
                      <Image src={nft.coverUrl || ""} alt="NFT" fill unoptimized className="object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleListNFT(nft.tokenId)}
                          className="px-6 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Tag className="w-4 h-4" /> List for Sale
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white line-clamp-1">{nft.trackTitle}</h3>
                      <p className="text-xs text-[#ff2a5f] mt-1 font-mono">Token #{nft.tokenId.toString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-[#2a2a2a] rounded-3xl text-center">
                <p className="text-gray-500">No collectibles found in your wallet.</p>
              </div>
            )}
          </section>

          {/* Tracks Section */}
          <section>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
              <Music className="text-[#ff2a5f] w-6 h-6" /> Your Published Tracks
            </h2>
            {artistTracks.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {artistTracks.map((track) => (
                  <TrackCard key={track.id} track={track} onPlay={handlePlayTrack} />
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-[#2a2a2a] rounded-3xl text-center">
                <p className="text-gray-500">No tracks published yet.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
