'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function AppPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle waitlist signup
    console.log('Email submitted:', email);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grid background with orange glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Main grid lines with orange glow */}
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(254, 51, 10, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(254, 51, 10, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            filter: 'blur(0.5px)',
            boxShadow: 'inset 0 0 300px rgba(254, 51, 10, 0.15)'
          }}
        />
        
        {/* Secondary grid with lighter orange */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            filter: 'blur(0.3px)'
          }}
        />
        
        {/* Glowing grid intersections - brighter orange */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle 2px at 0 0, rgba(254, 51, 10, 0.4) 0%, transparent 50%),
              radial-gradient(circle 2px at 80px 80px, rgba(254, 51, 10, 0.4) 0%, transparent 50%)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: '0 0, 40px 40px',
            filter: 'blur(1.5px)'
          }}
        />
        
        {/* Amber glow accents on intersections */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle 3px at 40px 40px, rgba(251, 191, 36, 0.3) 0%, transparent 70%)
            `,
            backgroundSize: '80px 80px',
            filter: 'blur(2px)'
          }}
        />
      </div>

      {/* Aurora glow from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none z-0">
        {/* Base glow layer */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-t from-[#fe330a]/30 via-[#fe330a]/10 to-transparent blur-[100px] rounded-full" />
        
        {/* Secondary aurora wave */}
        <div className="absolute bottom-0 left-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/25 via-transparent to-transparent blur-[80px] rounded-full" 
             style={{ transform: 'skewX(-15deg)' }} />
        <div className="absolute bottom-0 right-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/25 via-transparent to-transparent blur-[80px] rounded-full" 
             style={{ transform: 'skewX(15deg)' }} />
        
        {/* Tertiary subtle waves */}
        <div className="absolute bottom-[100px] left-[10%] w-[30%] h-[200px] bg-gradient-to-t from-[#f97316]/20 via-transparent to-transparent blur-[60px] rounded-full" />
        <div className="absolute bottom-[150px] right-[15%] w-[35%] h-[250px] bg-gradient-to-t from-[#fbbf24]/15 via-transparent to-transparent blur-[70px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Image
              src="/stellar.png"
              alt="Stellar Snaps logo"
              width={96}
              height={96}
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
          Get early access
        </h1>

        {/* Description */}
        <p className="font-inter-italic text-gray-300 text-center max-w-md mb-12 leading-relaxed">
          Be amongst the first to experience Stellar Snaps and launch a viral waitlist. Sign up to be notified when we launch!
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8 w-full max-w-md">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50 transition-colors"
            required
          />
          <button
            type="submit"
            className="font-bricolage px-6 py-3 bg-[#fe330a] hover:bg-[#d92b08] text-white font-medium rounded-lg transition-all shadow-[0_4px_15px_rgba(254,51,10,0.3)] hover:shadow-[0_6px_20px_rgba(254,51,10,0.4)]"
          >
            Join waitlist
          </button>
        </form>

        {/* Social Proof */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-orange-400 to-red-500"
              />
            ))}
          </div>
          <span className="font-inter-italic text-sm text-gray-400">
            Join <span className="text-white font-medium">12,500+</span> others on the waitlist
          </span>
        </div>
      </div>
    </div>
  );
}
