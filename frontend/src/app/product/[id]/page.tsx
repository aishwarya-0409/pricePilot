"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, ThermometerSun, CloudLightning, ShieldAlert, Zap, Clock, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, priceRes, recRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/products/${id}`),
          axios.get(`http://localhost:8000/api/products/${id}/prices`),
          axios.get(`http://localhost:8000/api/products/${id}/recommend`),
        ]);

        setProduct(prodRes.data);
        
        // Append the future predicted data point so Recharts draws the dashed line!
        const fullData = [...priceRes.data];
        if (recRes.data.future_data_point) {
           fullData.push({
             date: recRes.data.future_data_point.date,
             future_price: recRes.data.future_data_point.predicted_price,
             // To connect the solid line to the dashed line seamlessly, 
             // we need the last known price to also have a 'future_price' value
           });
           
           // Connect the gap
           fullData[fullData.length - 2].future_price = fullData[fullData.length - 2].price;
        }

        setPrices(fullData);
        setRecommendation(recRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-radar-border)] border-t-[var(--color-radar-accent)] rounded-full animate-spin glow-cyan" />
          <p className="text-gray-400 font-mono tracking-widest text-sm uppercase">Analyzing Market...</p>
        </div>
      </div>
    );
  }

  const isWait = recommendation?.action === "WAIT";
  const accentColor = isWait ? "var(--color-radar-danger)" : "var(--color-radar-accent)";
  const glowClass = isWait ? "glow-red" : "glow-cyan";

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col">
      {/* Top Nav */}
      <nav className="flex items-center justify-between mb-8">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Search</span>
        </button>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-mono text-gray-500 uppercase tracking-widest">Product Details</span>
        </div>
      </nav>

      {/* Main 3-Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Visuals & Mood */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-matte p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Fake placeholder image for product */}
            <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-[#2a2a2a] to-[#111] mb-6 flex items-center justify-center border border-[var(--color-radar-border)]">
              <span className="text-6xl">📱</span>
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">{product?.name}</h1>
            <p className="text-gray-500 text-sm mb-6">{product?.category}</p>

            <div className="w-full flex justify-between items-center p-4 bg-black/40 rounded-xl border border-[var(--color-radar-border)]">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price Trend</span>
                <span className={`font-semibold ${product?.market_mood === 'Volatile' ? 'text-[var(--color-radar-danger)]' : 'text-[var(--color-radar-accent)]'}`}>
                  {product?.market_mood}
                </span>
              </div>
              {product?.market_weather === "Storm" ? <CloudLightning className="text-[var(--color-radar-danger)] w-8 h-8" /> : <ThermometerSun className="text-yellow-500 w-8 h-8" />}
            </div>
          </motion.div>

          {/* New Market Comparison Module */}
          {product?.competitors && product.competitors.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-matte p-6 rounded-2xl flex flex-col gap-4 border border-[var(--color-radar-border)]"
            >
              <h3 className="text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Live Market Prices
              </h3>
              <div className="flex flex-col gap-3">
                {product.competitors.map((comp: any, idx: number) => (
                  <a key={idx} href={comp.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-gray-800 hover:border-[var(--color-radar-accent)] transition-colors group">
                    <span className="font-medium text-gray-300 group-hover:text-white transition-colors">{comp.platform}</span>
                    <span className="font-mono text-[var(--color-radar-accent)]">₹{comp.price.toLocaleString()}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* CENTER PANEL: The Cinematic Chart */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-matte p-6 rounded-2xl flex-1 border ${isWait ? 'border-[var(--color-radar-danger)]/30' : 'border-[var(--color-radar-accent)]/30'} relative overflow-hidden transition-all duration-1000`}
          >
            {/* The Buy/Wait Pulse */}
            <div className={`absolute top-0 left-0 w-full h-1 ${isWait ? 'bg-[var(--color-radar-danger)]' : 'bg-[var(--color-radar-accent)]'} ${glowClass} animate-pulse`} />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Price History</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">₹{product?.current_price.toLocaleString()}</span>
                  {isWait && <span className="text-sm text-[var(--color-radar-danger)] font-mono flex items-center gap-1"><TrendingDown className="w-4 h-4"/> Volatile Peak</span>}
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-full border border-dashed ${isWait ? 'border-[var(--color-radar-danger)] text-[var(--color-radar-danger)]' : 'border-[var(--color-radar-accent)] text-[var(--color-radar-accent)]'} font-mono text-sm font-bold flex items-center gap-2`}>
                {isWait ? <Clock className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {recommendation?.action}
              </div>
            </div>

            {/* Recharts Implementation */}
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prices} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['dataMin - 5000', 'dataMax + 5000']} stroke="#333" tick={{fill: '#666', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  {/* Historical Solid Line */}
                  <Area type="monotone" dataKey="price" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                  {/* Future Prediction Dashed Line */}
                  <Area type="monotone" dataKey="future_price" stroke={accentColor} strokeWidth={3} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {isWait && (
              <div className="mt-6 flex items-center justify-between p-4 bg-red-950/20 border border-red-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-[var(--color-radar-danger)]" />
                  <div>
                    <p className="text-sm text-[var(--color-radar-danger)] font-medium">Wait Recommendation Active</p>
                    <p className="text-xs text-red-400/80">Price is predicted to drop.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Potential Savings</p>
                  <p className="text-lg font-bold text-white">₹{recommendation.savings.toLocaleString()}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT PANEL: AI Insights Terminal */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-matte p-6 rounded-2xl flex flex-col border border-[var(--color-radar-border)]"
          >
            <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Smart Advice
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">AI Certainty</span>
                <span className="text-white font-mono">{recommendation?.confidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${recommendation?.confidence}%` }} 
                  className={`h-full ${glowClass} ${isWait ? 'bg-[var(--color-radar-danger)]' : 'bg-[var(--color-radar-accent)]'}`} 
                />
              </div>
            </div>

            {/* The Big Recommendation Reason */}
            <div className={`p-4 rounded-xl mb-6 ${isWait ? 'bg-red-950/40 border border-red-900/50' : 'bg-[var(--color-radar-accent)]/10 border border-[var(--color-radar-accent)]/30'}`}>
              <p className={`text-base font-semibold leading-relaxed ${isWait ? 'text-[var(--color-radar-danger)]' : 'text-[var(--color-radar-accent)]'}`}>
                {recommendation?.reason}
              </p>
            </div>

            <div className="font-mono text-xs text-gray-400 space-y-3">
              {recommendation?.logs.map((log: string, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.2 }}
                  key={idx} 
                  className="flex gap-2"
                >
                  <span className={log.includes('[✓]') ? 'text-green-400' : log.includes('[!]') ? 'text-yellow-400' : 'text-gray-500'}>
                    {log.substring(0, 3)}
                  </span>
                  <span>{log.substring(3)}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <button className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isWait 
                ? 'bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-800' 
                : 'bg-[var(--color-radar-accent)] text-black hover:opacity-90 glow-cyan'
              }`}>
                {isWait ? 'Set Price Alert' : 'Buy Now'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
