"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Activity, Zap, Loader2, Camera, Image } from "lucide-react";
import axios from "axios";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loadingText, setLoadingText] = useState("Scanning...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (queryToUse?: string) => {
    const query = queryToUse || searchQuery;
    if (!query) return;
    
    setIsScanning(true);
    setLoadingText("Scanning Amazon...");
    
    // Simulate intelligent loading states
    setTimeout(() => setLoadingText("Scanning Flipkart..."), 2500);
    setTimeout(() => setLoadingText("Scanning Myntra..."), 5000);
    setTimeout(() => setLoadingText("Scanning Meesho..."), 7500);
    setTimeout(() => setLoadingText("Comparing all prices..."), 10000);

    try {
      const response = await axios.post("http://localhost:8000/api/products/scrape", {
        query: query
      });
      
      if (response.data.product_id) {
        router.push(`/product/${response.data.product_id}`);
      }
    } catch (err) {
      console.error("Scraping failed", err);
      setIsScanning(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setLoadingText("Analyzing Image...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const idResponse = await axios.post("http://localhost:8000/api/products/identify-image", formData);
      const productName = idResponse.data.product_name;
      setSearchQuery(productName);
      
      // Now trigger the actual scan with the identified name
      await handleScan(productName);
    } catch (err) {
      console.error("Image analysis failed", err);
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
              placeholder="Enter product or paste link (Amazon, Myntra...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              className="w-full py-5 pr-6 bg-transparent text-lg text-white placeholder-gray-600 focus:outline-none"
            />
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="p-3 text-gray-500 hover:text-[var(--color-radar-accent)] transition-colors"
              title="Search by image"
            >
              <Camera className="w-6 h-6" />
            </button>

            <button 
              onClick={() => handleScan()}
              disabled={isScanning || !searchQuery}
              className="mr-3 px-4 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
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
