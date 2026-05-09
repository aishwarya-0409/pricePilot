"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, ArrowRight, Loader2, Radar } from "lucide-react";
import axios from "axios";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await axios.post("http://localhost:8000/auth/request-otp", { email });
      setStep("otp");
    } catch (err) {
      setError("Failed to send OTP. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:8000/auth/verify-otp", { email, code: otp });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setTimeout(() => { setStep("email"); setOtp(""); setSuccess(false); }, 500);
      }, 1500);
    } catch (err) {
      setError("Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md p-8 relative overflow-hidden bg-matte rounded-2xl shadow-2xl border border-[var(--color-radar-border)]"
          >
            {/* The Radar Sweep Animation Background */}
            <motion.div 
              className="absolute inset-0 radar-sweep opacity-20 pointer-events-none"
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-3 mb-4 rounded-full bg-black/50 border border-[var(--color-radar-border)] glow-cyan">
                <Radar className="w-8 h-8 text-[var(--color-radar-accent)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                {step === "email" ? "Sign In" : "Enter Verification Code"}
              </h2>
              <p className="text-sm text-gray-400 mb-8">
                {step === "email" 
                  ? "Enter your email address to sign in or create an account." 
                  : `A 6-digit code has been sent to ${email}`}
              </p>

              {error && (
                <div className="w-full p-3 mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
                  {error}
                </div>
              )}

              {success ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="w-full py-8 text-center"
                >
                  <p className="text-[var(--color-radar-accent)] font-medium text-lg glow-cyan">
                    Access Granted. Welcome back.
                  </p>
                </motion.div>
              ) : step === "email" ? (
                <form onSubmit={handleRequestOTP} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="commander@startup.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-[var(--color-radar-border)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-radar-accent)] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-radar-accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Login Code"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-10 pr-4 py-3 tracking-[0.5em] text-center bg-black/40 border border-[var(--color-radar-border)] rounded-xl text-white focus:outline-none focus:border-[var(--color-radar-accent)] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-radar-accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all glow-cyan"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-xs text-gray-500 hover:text-white mt-2"
                  >
                    Change email address
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
