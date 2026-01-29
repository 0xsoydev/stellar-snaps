'use client';

import React from 'react';

const RoadmapItem = ({
  step,
  title,
  description,
  isActive = false,
  isLast = false,
  onMouseEnter,
}: {
  step: string;
  title: string;
  description: string;
  isActive?: boolean;
  isLast?: boolean;
  onMouseEnter?: () => void;
}) => {
  return (
    <div 
      className={`relative h-full flex flex-col transition-all duration-300 ease-in-out cursor-pointer ${isActive ? 'z-10 -my-12' : 'py-12 group'}`}
      onMouseEnter={onMouseEnter}
    >
      {/* Vertical Border for non-highlighted items (right side) */}
      {!isActive && !isLast && (
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10 hidden md:block" />
      )}

      {/* Content Container */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-b from-[#fe330a] via-[#f97316] to-[#fbbf24] rounded-2xl p-8 shadow-[0_20px_40px_rgba(254,51,10,0.3)] scale-105'
            : 'px-6'
        }`}
      >
        {/* Top Section - Fixed height for alignment */}
        {/* 
            Alignment Math:
            Standard Item: py-12 (48px) + Spacer (180px) + Dot Center (12px) = 240px from grid top.
            Highlighted Item: -my-12 (-48px start) + p-8 (32px) + Spacer (?) + Dot Center (12px) = 240px.
            -48 + 32 + Spacer + 12 = 240 => -4 + Spacer = 240 => Spacer = 244px.
        */}
        <div className={`${isActive ? 'h-[244px]' : 'h-[180px]'} flex flex-col justify-end pb-4 transition-all duration-300`} />

        {/* Timeline Dot area */}
        <div className="relative h-6 flex items-center justify-center mb-8">
             {/* Dot Container for alignment */}
             <div className="relative flex items-center justify-center w-8 h-8">
                {/* Outer Ring */}
                <div 
                  className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-white bg-white/10 scale-125' 
                      : 'border-white/40 bg-black group-hover:border-white group-hover:bg-white/10'
                  }`} 
                />
                
                {/* Inner Circle */}
                <div 
                  className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                      : 'bg-white/60 group-hover:bg-white'
                  }`} 
                />
             </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className={`text-4xl font-bold mb-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-[#fe330a] to-[#fbbf24]'}`}>
            {step}
          </div>
          <h4 className="text-xl font-medium text-white mb-3">{title}</h4>
          <p className={`font-inter-italic text-sm leading-relaxed transition-colors duration-300 ${isActive ? 'text-white/90' : 'text-neutral-400'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function HowItWorks() {
  const [activeStep, setActiveStep] = React.useState<string | null>(null);

  const steps = [
    {
      step: '01',
      title: 'Connect Wallet',
      description: 'Securely link your Freighter wallet with a single click. No registration or personal information required.',
    },
    {
      step: '02',
      title: 'Generate Link',
      description: 'Create a custom payment link in seconds. Set the amount, add an optional memo, and copy your unique URL.',
    },
    {
      step: '03',
      title: 'Share & Collect',
      description: 'Share your link via email, social media, or QR code. Collect payments instantly from anyone, anywhere.',
    },
    {
      step: '04',
      title: 'Track Earnings',
      description: 'Monitor your transactions and settlement history in real-time directly from your dashboard.',
    },
  ];

  return (
    <section className="relative w-full bg-transparent min-h-[800px] flex flex-col text-white font-sans overflow-hidden py-24 px-8">
       {/* Section Header */}
        <div className="text-center mb-20 relative z-10">
          <h2 className="text-6xl font-bold text-white mb-6 tracking-tight">
            How It Works
          </h2>
          <p className="font-inter-italic text-neutral-400 text-lg max-w-2xl mx-auto">
            Start accepting payments in minutes with our streamlined process
          </p>
        </div>

      {/* Grid Container */}
      <div 
        className="max-w-[1400px] mx-auto w-full flex-1 relative mt-12"
        onMouseLeave={() => setActiveStep(null)}
      >
         {/* Top Horizontal Dashed Line */}
         <div className="absolute top-0 left-0 right-0 h-[2px] border-t-2 border-dashed border-white/20 hidden md:block" />

        {/* Middle Horizontal Dashed Line - Positioned to align with dots */}
        <div className="absolute top-[240px] left-0 right-0 h-[2px] border-t-2 border-dashed border-white/20 hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 h-full">
          {steps.map((stepItem, index) => (
            <RoadmapItem
              key={stepItem.step}
              {...stepItem}
              isActive={activeStep === stepItem.step}
              isLast={index === steps.length - 1}
              onMouseEnter={() => setActiveStep(stepItem.step)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
