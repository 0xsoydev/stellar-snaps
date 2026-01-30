'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-[110vh] flex items-center justify-center overflow-visible text-white">
      {/* 
        --------------------------------------------------
        BACKGROUND EFFECTS & COLORFUL ARCS
        --------------------------------------------------
      */}
      
      {/* 1. Main Background Gradient / Noise */}
      <div className="absolute inset-0 bg-transparent z-0 pointer-events-none" />

      {/* Container for the Arcs - Positioned to flow into next section */}
      <div 
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[85vw] h-[85vw] min-w-[850px] z-0 pointer-events-none select-none flex items-center justify-center opacity-80"
        style={{
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
        }}
      >
        
        {/* Outer Ring - Deep Red/Orange */}
        <div className="absolute w-[115%] h-[115%] border-[2px] border-orange-600/30 rounded-full shadow-[0_0_100px_rgba(254,51,10,0.3)] opacity-40 blur-[2px]" />
        <div className="absolute w-[113%] h-[113%] border border-orange-500/20 rounded-full" />

        {/* Middle Ring - The Main #fe330a Color */}
        <div className="absolute w-[100%] h-[100%] border-[4px] border-[#fe330a]/40 rounded-full shadow-[0_0_120px_rgba(254,51,10,0.4)] opacity-60" 
             style={{ boxShadow: 'inset 0 0 60px rgba(254,51,10,0.2), 0 0 60px rgba(254,51,10,0.4)' }}/>
        
        {/* Inner Ring - Golden/Sun Yellow */}
        <div className="absolute w-[85%] h-[85%] border-[8px] border-amber-500/50 rounded-full shadow-[0_0_150px_rgba(251,191,36,0.5)] opacity-80 mix-blend-screen"
             style={{ boxShadow: 'inset 0 0 80px rgba(251,191,36,0.3), 0 0 80px rgba(251,191,36,0.5)' }} />

        {/* Innermost Glow - White/Gold Core */}
        <div className="absolute w-[50%] h-[50%] bg-gradient-to-br from-amber-500/10 to-[#fe330a]/10 rounded-full blur-[100px]" />
      </div>

      {/* 3. Top Center Glow (Subtle Sun Haze) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-black to-black blur-[80px] z-0 pointer-events-none" />

      {/* 
        --------------------------------------------------
        CONTENT
        --------------------------------------------------
      */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto -mt-20">
        
        {/* Heading */}
        <h1 className="text-6xl sm:text-7xl md:text-[5.5rem] font-medium tracking-tight text-white mb-8 leading-[1.1]">
          Shareable payments <br className="hidden md:block" />
          on the <span className="text-[#fe330a]">Stellar</span> Network
        </h1>

        {/* Subheading */}
        <p className="text-gray-400 text-lg md:text-[1.1rem] max-w-xl mx-auto mb-12 leading-relaxed font-light">
          Create payment request links in seconds. Share them anywhere. Get paid in XLM, USDC, and more with the power of web+stellar protocols.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href="/app" className="px-8 py-3.5 bg-[#fe330a] hover:bg-[#d92b08] text-white text-[15px] font-medium transition-all shadow-[0_4px_20px_rgba(254,51,10,0.3)] hover:shadow-[0_6px_25px_rgba(254,51,10,0.4)] min-w-[140px] text-center">
            Launch App
          </a>
          <a href="#create-snap-demo" className="px-8 py-3.5 border border-white/10 bg-white/[0.02] backdrop-blur-sm text-white text-[15px] font-medium transition-all hover:bg-white/[0.05] min-w-[140px] text-center">
            Learn More
          </a>
        </div>
      </div>

      {/* 
        --------------------------------------------------
        BOTTOM GRADIENT / FADE
        --------------------------------------------------
      */}
      {/* Bottom Center Beam (White/Orange rising up) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[300px] bg-gradient-to-t from-orange-200 via-[#fe330a] to-transparent blur-[3px] opacity-60 z-0" 
        style={{
          transform: `translateX(-50%) translateY(${scrollY * 0.2}px)`,
        }}
      />
      
      {/* Bottom atmospheric glow */}
      <div 
        className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/10 blur-[120px] rounded-full z-0 pointer-events-none"
        style={{
          transform: `translateX(-50%) translateY(${scrollY * 0.1}px)`,
        }}
      />
      
      {/* Fade into the next section - REMOVED to ensure seamless continuity */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" /> */}
    </section>
  );
}