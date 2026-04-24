import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";
import { AudioPlayerProvider } from "@/context/AudioPlayerContext";

export const metadata: Metadata = {
  title: "BeatChain - Decentralized Music Streaming",
  description: "Web3 Music Streaming Platform powered by Ethereum & IPFS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden selection:bg-[#ff2a5f] selection:text-white">
        <Navbar />
        <AudioPlayerProvider>
          <main className="pt-16 pb-24 min-h-screen">
            {children}
          </main>
          <AudioPlayer />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
