"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";


const SLIDES = [
  { src: "/images/zap-star.png", caption: "Celebrate every win ⭐" },
  { src: "/images/zap-breathe.png", caption: "Take it one step at a time 🕐" },
  { src: "/images/zap-friends.png", caption: "You're never alone on this journey 💙" },
];

export default function Landing() {
  const router = useRouter();
  const { onboarded, setMode, parentPin, setParentUnlocked } = useApp();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 3000);
    return () => clearInterval(t);
  }, []);

  function goKid() {
    setMode("kid");
    router.push(onboarded ? "/now" : "/onboarding");
  }

  function goParent() {
    const pin = window.prompt("Enter parent PIN:");
    if (!pin) return;
    if (pin === parentPin) {
      setParentUnlocked(true);
      router.push("/parent");
    } else {
      window.alert("Incorrect PIN. Default: 1234");
    }
  }

  return (
    <div className="bg-[#0f0e1a] text-[#e4e1e9] overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 star-field" />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#1a1040]/60 via-[#0f0e1a]/40 to-[#131318]" />
      <div className="fixed -top-20 -left-20 w-80 h-80 bg-[#c0c1ff]/8 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-[#ffb95f]/8 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Parent access — subtle top right */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        onClick={goParent}
        className="fixed top-5 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        <span className="material-symbols-outlined text-[#908fa0] text-sm">lock</span>
        <span className="text-[#908fa0] text-xs font-label tracking-wider">Parent</span>
      </motion.button>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="font-headline italic text-3xl tracking-tight text-[#c0c1ff] mb-6"
        >
          Momentum
        </motion.h1>

        {/* Character carousel */}
        <div className="relative w-72 h-64 mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <Image
                src={SLIDES[slide].src}
                alt={SLIDES[slide].caption}
                width={260}
                height={220}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>
          </AnimatePresence>
          {/* Dot indicators */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`rounded-full transition-all ${i === slide ? "w-5 h-2 bg-[#fbbf24]" : "w-2 h-2 bg-white/20"}`} />
            ))}
          </div>
        </div>

        {/* Caption */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`caption-${slide}`}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[#c7c4d7] font-kid font-bold text-sm mb-6 h-5"
          >
            {SLIDES[slide].caption}
          </motion.p>
        </AnimatePresence>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="max-w-xs w-full mb-8"
        >
          <h2 className="font-kid font-extrabold text-2xl text-[#e4e1e9] mb-2 leading-tight">
            Your calm companion for getting started
          </h2>
          <p className="text-[#908fa0] font-kid text-sm">Ready for today&apos;s adventure?</p>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={goKid}
          className="group w-full max-w-xs h-16 flex items-center justify-center bg-[#fbbf24] text-[#472a00] font-kid font-black text-xl rounded-full shadow-[0_8px_0_#ca8100] hover:shadow-[0_4px_0_#ca8100] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all uppercase tracking-wide"
        >
          Start Adventure! 🚀
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-4 text-[#908fa0] text-xs font-kid"
        >
          No sign up needed · Free to use
        </motion.p>
      </main>

      <footer className="fixed bottom-6 w-full flex justify-center px-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/5 text-[10px] text-[#908fa0] tracking-widest uppercase font-label">
          <span className="material-symbols-outlined text-xs">verified_user</span>
          Cognitive Sanctuary Protocol Active
        </div>
      </footer>
    </div>
  );
}
