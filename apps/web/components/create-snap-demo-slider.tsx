'use client';

import { useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    id: 'create-snap',
    title: 'Create Snap',
    subtitle: 'Generate payment links in seconds',
    description: 'Set amount, destination, and optional memo. Share one link—get paid in XLM, USDC, and more on the Stellar network.',
    cta: 'Create Snap',
    ctaHref: '/dashboard',
    nextLabel: 'API Key →',
  },
  {
    id: 'api-key',
    title: 'API Key',
    subtitle: 'Integrate with Stellar Snaps',
    description: 'Get an API key to create snaps programmatically, list payments, and build on the Stellar network.',
    cta: 'Get API Key',
    ctaHref: '/developers',
    nextLabel: '← Create Snap',
  },
] as const;

export default function CreateSnapDemoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section id="create-snap-demo" className="relative w-full bg-black text-white overflow-hidden py-16 md:py-24 scroll-mt-20">
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6">
        {/* Slider track */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Slide 1: Create Snap */}
            <div className="w-full flex-shrink-0 min-w-0 px-2">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {SLIDES[0].title}
                </h2>
                <p className="font-inter-italic text-[#fe330a] text-lg mb-4">
                  {SLIDES[0].subtitle}
                </p>
                <p className="font-inter-italic text-neutral-400 max-w-xl mx-auto mb-8">
                  {SLIDES[0].description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={SLIDES[0].ctaHref}
                    className="font-bricolage px-8 py-3.5 bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold rounded-xl transition-colors"
                  >
                    {SLIDES[0].cta}
                  </Link>
                  <button
                    type="button"
                    onClick={() => goToSlide(1)}
                    className="font-bricolage px-6 py-3 border border-neutral-600 text-neutral-300 hover:border-[#fe330a] hover:text-white rounded-xl transition-colors"
                  >
                    {SLIDES[0].nextLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* Slide 2: API Key */}
            <div className="w-full flex-shrink-0 min-w-0 px-2">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {SLIDES[1].title}
                </h2>
                <p className="font-inter-italic text-[#fe330a] text-lg mb-4">
                  {SLIDES[1].subtitle}
                </p>
                <p className="font-inter-italic text-neutral-400 max-w-xl mx-auto mb-8">
                  {SLIDES[1].description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={SLIDES[1].ctaHref}
                    className="font-bricolage px-8 py-3.5 bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold rounded-xl transition-colors"
                  >
                    {SLIDES[1].cta}
                  </Link>
                  <button
                    type="button"
                    onClick={() => goToSlide(0)}
                    className="font-bricolage px-6 py-3 border border-neutral-600 text-neutral-300 hover:border-[#fe330a] hover:text-white rounded-xl transition-colors"
                  >
                    {SLIDES[1].nextLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentSlide ? 'bg-[#fe330a] scale-125' : 'bg-neutral-600 hover:bg-neutral-500'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
