"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Activity, Zap, Loader2 } from "lucide-react";
import axios from "axios";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loadingText, setLoadingText] = useState("Scanning...");

  const handleScan = async () => {
    if (!searchQuery) return;
    
    setIsScanning(true);
    setLoadingText("Scanning Amazon...");
    
    // Simulate intelligent loading states
    setTimeout(() => setLoadingText("Scanning Flipkart..."), 3000);
    setTimeout(() => setLoadingText("Comparing prices..."), 6000);
    setTimeout(() => setLoadingText("Finding best deal..."), 9000);

    try {
      // Send the query to our new Python Scraper!
      const response = await axios.post("http://localhost:8000/api/products/scrape", {
        query: searchQuery
      });
      
      // Navigate to the newly created product's Mission Control page
      if (response.data.product_id) {
        router.push(`/product/${response.data.product_id}`);
      }
    } catch (err) {
      console.error("Scraping failed", err);
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-radar-accent)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-radar-danger)] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-[var(--color-radar-accent)]" />
          <span className="text-xl font-bold tracking-tight text-white">PricePilot</span>
        </div>
        <button 
          onClick={() => setIsLoginOpen(true)}
          className="px-5 py-2 text-sm font-medium border border-[var(--color-radar-border)] rounded-full hover:bg-[var(--color-radar-surface)] hover:text-[var(--color-radar-accent)] transition-all"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section: Live Market Search */}
      <div className="w-full max-w-3xl z-10 flex flex-col items-center mt-[-10vh]">
        <div className="flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[var(--color-radar-border)] bg-[var(--color-radar-surface)]/50 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--color-radar-accent)] animate-pulse shadow-[0_0_8px_rgba(0,255,204,0.6)]" />
          <span className="text-xs uppercase tracking-widest text-gray-400 font-mono">Live Price Tracking Active</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-center text-white mb-6 tracking-tight leading-tight">
          What are you <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-radar-accent)] to-blue-500">
            planning to buy?
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl text-center mb-12 max-w-2xl">
          Enter a product to scan the digital marketplace. Our AI predicts price crashes, analyzes volatility, and tells you exactly when to pull the trigger.
        </p>

        {/* The Search Bar */}
        <div className="relative w-full max-w-2xl group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-radar-accent)] to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center w-full bg-matte rounded-2xl overflow-hidden shadow-2xl">
            <div className="pl-6 pr-4 py-4">
              <Search className="w-6 h-6 text-gray-500 group-focus-within:text-[var(--color-radar-accent)] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="e.g. iPhone 16 Pro Max, Sony WH-1000XM5..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-5 pr-6 bg-transparent text-lg text-white placeholder-gray-600 focus:outline-none"
            />
            <button 
              onClick={handleScan}
              disabled={isScanning || !searchQuery}
              className="absolute right-3 px-4 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Zap className="w-4 h-4 fill-black text-black" />}
              {isScanning ? loadingText : "Search"}
            </button>
          </div>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </main>
  );
}
