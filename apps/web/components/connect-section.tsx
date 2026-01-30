'use client';

import React from 'react';

export default function ConnectSection() {
  return (
    <section className="relative w-full bg-[#171717] min-h-[400px] flex flex-col items-center justify-center overflow-hidden pb-20">
      {/* Content Container */}
      <div className="relative z-20 flex flex-col items-center text-center gap-12">
        
        {/* Social Icons - Made larger and more prominent */}
        <div className="flex items-center gap-8">
          {/* LinkedIn */}
          <a href="#" className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:bg-white hover:text-black hover:scale-110 hover:border-transparent transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
          
          {/* Instagram */}
          <a href="#" className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:bg-white hover:text-black hover:scale-110 hover:border-transparent transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

           {/* Facebook/Meta */}
           <a href="#" className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:bg-white hover:text-black hover:scale-110 hover:border-transparent transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </a>
        </div>

        {/* Contact Pills */}
        <div className="flex flex-col sm:flex-row gap-6">
          <a 
            href="mailto:hello@stellarsnaps.com"
            className="font-bricolage px-8 py-4 rounded-full border border-white/10 bg-[#1e1e1e] text-neutral-300 text-base font-medium hover:bg-white hover:text-black hover:border-transparent transition-all duration-300 flex items-center justify-center min-w-[240px] shadow-lg hover:shadow-white/20"
          >
            hello@stellarsnaps.com
          </a>
          <a 
            href="#"
            className="font-bricolage px-8 py-4 rounded-full border border-white/10 bg-[#1e1e1e] text-neutral-300 text-base font-medium hover:bg-white hover:text-black hover:border-transparent transition-all duration-300 flex items-center justify-center min-w-[240px] shadow-lg hover:shadow-white/20"
          >
            +1 (555) 000-000
          </a>
        </div>
      </div>
    </section>
  );
}
