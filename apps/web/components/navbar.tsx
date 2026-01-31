'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Check if footer is in view
      const footer = document.getElementById('main-footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        // Hide navbar when footer top is at or above the viewport top + 100px
        setHidden(footerRect.top <= 100);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        hidden 
          ? 'opacity-0 -translate-y-full pointer-events-none' 
          : scrolled 
            ? 'bg-black/50 backdrop-blur-md border-b border-[#fe330a]/10 py-4 opacity-100' 
            : 'bg-transparent py-6 opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bricolage text-xl font-bold text-white tracking-tight flex items-center gap-3">
          <img
            src="/stellar.png"
            alt="Stellar Snaps logo"
            className="h-8 w-auto"
          />
          Stellar Snaps
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {[ 'Features', 'Pricing', 'Developers'].map((item) => (
            <Link 
              key={item} 
              href={item === 'Developers' ? '/developers' : item === 'Pricing' ? '/pricing' : `#${item.toLowerCase()}`}
              className="font-bricolage text-sm font-medium text-gray-300 hover:text-[#fe330a] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="font-bricolage px-5 py-2 bg-[#fe330a] hover:bg-[#d92b08] text-sm font-medium text-white shadow-[0_0_15px_rgba(254,51,10,0.4)] transition-all hover:shadow-[0_0_20px_rgba(254,51,10,0.6)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
