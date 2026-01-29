'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [time, setTime] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: undefined 
      }) + ' EST');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="relative bg-black text-white overflow-hidden -mt-8 pt-8 pb-12">
      {/* Moving Gradient Background Effect with Parallax */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Main orange/red blob - Parallax layer 1 (slowest) */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] bg-gradient-to-b from-[#fe330a] via-[#fe330a] to-transparent opacity-80 blur-[80px] sm:blur-[120px] origin-center" 
          style={{ 
            clipPath: 'ellipse(150% 100% at 50% 0%)',
            background: 'radial-gradient(circle at 50% 0%, #fe330a 0%, #ff5e3a 30%, transparent 70%)',
            transform: `translateY(${scrollY * 0.1}px)`
          }} 
        />
        {/* Secondary movement blob - Parallax layer 2 (medium speed) */}
         <div 
           className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[#fe330a] blur-[100px] opacity-60 animate-blob" 
           style={{
             transform: `translate(${scrollY * 0.15}px, ${scrollY * 0.2}px)`
           }}
         />
        {/* Tertiary parallax layer (fastest) */}
        <div 
          className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-[#f97316] blur-[80px] opacity-40"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />
      </div>

      <div className="relative z-10 px-6 sm:px-12 pt-20 sm:pt-32 pb-8 flex flex-col justify-between min-h-[600px] sm:min-h-[800px]">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0">
          {/* Navigation - Left */}
          <div className="font-bricolage flex flex-col gap-2 text-2xl sm:text-3xl font-medium tracking-tight">
            <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">Dashboard</Link>
            <Link href="/demo" className="hover:text-neutral-300 transition-colors">Demo</Link>
            <Link href="#features" className="hover:text-neutral-300 transition-colors">Features</Link>
          </div>

          {/* Newsletter - Right */}
          <div className="flex flex-col gap-6 max-w-md w-full">
            <p className="font-inter-italic text-lg sm:text-xl leading-snug">
              Get industry insights and creative inspiration straight to your inbox.
            </p>
            <div className="relative border-b border-white/30 pb-2 group focus-within:border-white transition-colors">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-transparent outline-none text-lg placeholder:text-white/60"
              />
              <button className="font-bricolage absolute right-0 bottom-2 text-white/80 group-hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Big Text - Bottom with Parallax */}
        <div className="mt-auto" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
          <h1 className="text-[14vw] font-bold leading-none tracking-tighter text-center sm:text-left select-none pointer-events-none mix-blend-overlay opacity-90">
            Stellar Snaps
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="font-inter-italic border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm font-medium text-neutral-400 gap-4">
          <div>
            Copyright © Stellar Snaps
          </div>
          <div className="flex gap-8">
            <span>Brooklyn, NY</span>
            <span>{time}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="font-bricolage hover:text-white transition-colors">Instagram</a>
            <a href="#" className="font-bricolage hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
      
      {/* CSS Animation for the gradient blob */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </footer>
  );
}
