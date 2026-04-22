"use client";

import { useState } from "react";
import { Upload, Music, Image as ImageIcon, AlertCircle } from "lucide-react";
import { uploadFileToIPFS, getIPFSUrl } from "@/lib/ipfs";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !coverFile || !title || !genre) {
      setStatus("Please fill all fields and select both files.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading to IPFS...");

    try {
      // 1. Upload Cover Art to IPFS
      const coverCid = await uploadFileToIPFS(coverFile);
      setStatus("Cover art uploaded! Uploading audio...");

      // 2. Upload Audio to IPFS
      const audioCid = await uploadFileToIPFS(audioFile);
      setStatus("Files uploaded to IPFS! Registering on Blockchain...");

      // 3. Register on Smart Contract (simulated)
      // In full implementation, we'd call MusicRegistry.uploadTrack
      setTimeout(() => {
        setStatus("Success! Track has been published to BeatChain.");
        setIsUploading(false);
        setTitle("");
        setGenre("");
        setAudioFile(null);
        setCoverFile(null);
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus("An error occurred during upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2">Artist Dashboard</h1>
        <p className="text-gray-400">Upload your music to IPFS and register it on the blockchain.</p>
      </div>

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Track Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f] transition-colors"
                placeholder="e.g. Neon Dreams"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Genre</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff2a5f] transition-colors text-white"
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
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* Audio Upload */}
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ff2a5f]/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="audio/*" 
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-[#ff2a5f]" />
              </div>
              <h3 className="font-medium mb-1">Audio File</h3>
              <p className="text-sm text-gray-500">{audioFile ? audioFile.name : "MP3, WAV up to 50MB"}</p>
            </div>

            {/* Cover Upload */}
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ff7e40]/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-[#ff7e40]" />
              </div>
              <h3 className="font-medium mb-1">Cover Art</h3>
              <p className="text-sm text-gray-500">{coverFile ? coverFile.name : "JPG, PNG up to 5MB"}</p>
            </div>
          </div>

          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${status.includes('Success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#1f1f1f] border border-[#2a2a2a]'}`}>
              <AlertCircle className="w-5 h-5" />
              <span>{status}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isUploading}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              isUploading 
                ? 'bg-[#2a2a2a] text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#ff2a5f] to-[#ff7e40] text-white hover:opacity-90 glow-effect'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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
      </div>
    </div>
  );
}
