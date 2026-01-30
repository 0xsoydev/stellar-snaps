'use client';

export default function FeaturesSection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-transparent -mt-48 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Card 1 - Create Snaps */}
          <div className="group relative bg-black border border-neutral-800 p-8 hover:border-neutral-700 transition-all overflow-hidden aspect-square flex flex-col">
            {/* Corner dots */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-semibold text-white mb-3">
                Create Snaps
              </h3>
              <p className="font-inter-italic text-neutral-500 text-sm leading-relaxed">
                Generate payment links instantly with customizable amounts, memos, and destination addresses on Stellar.
              </p>

              {/* Visual element - Link icon illustration */}
              <div className="flex-1 flex items-center justify-center my-6">
                <div className="relative">
                  <svg className="w-20 h-20 text-neutral-700 group-hover:text-neutral-500 transition-colors" viewBox="0 0 100 100" fill="none">
                    <path 
                      d="M25 50 L45 30 L65 30" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M75 50 L55 70 L35 70" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                    <circle cx="25" cy="50" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="75" cy="50" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>

              <button className="font-bricolage w-full px-6 py-3 border border-neutral-800 hover:border-[#fe330a] hover:bg-[#fe330a] hover:text-white text-sm font-medium text-white transition-all uppercase tracking-wider">
                Start Now →
              </button>
            </div>
          </div>

          {/* Card 2 - Share Everywhere */}
          <div className="group relative bg-black border border-neutral-800 p-8 hover:border-neutral-700 transition-all overflow-hidden aspect-square flex flex-col">
            {/* Corner dots */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-semibold text-white mb-3">
                Share Everywhere
              </h3>
              <p className="font-inter-italic text-neutral-500 text-sm leading-relaxed">
                Distribute your payment links across X, Discord, email, or any platform. One link, unlimited reach.
              </p>

              {/* Visual element - Window with dots */}
              <div className="flex-1 flex items-center justify-center my-6">
                <div className="relative w-32 h-24 border border-neutral-700 group-hover:border-neutral-500 transition-colors">
                  {/* Window bar */}
                  <div className="absolute top-0 left-0 right-0 h-4 border-b border-neutral-700 flex items-center px-2 gap-1">
                    <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                  </div>
                  {/* Scattered dots inside */}
                  <div className="absolute top-8 left-4 w-1 h-1 bg-red-500 rounded-full" />
                  <div className="absolute top-10 left-8 w-1 h-1 bg-neutral-500 rounded-full" />
                  <div className="absolute top-12 left-6 w-1 h-1 bg-neutral-600 rounded-full" />
                  <div className="absolute top-9 right-6 w-1 h-1 bg-neutral-500 rounded-full" />
                  <div className="absolute top-14 right-8 w-1 h-1 bg-neutral-600 rounded-full" />
                  <div className="absolute top-11 left-16 w-1 h-1 bg-neutral-500 rounded-full" />
                </div>
              </div>

              <button className="font-bricolage w-full px-6 py-3 border border-neutral-800 hover:border-[#fe330a] hover:bg-[#fe330a] hover:text-white text-sm font-medium text-white transition-all uppercase tracking-wider">
                Build Now →
              </button>
            </div>
          </div>

          {/* Card 3 - Track Payments */}
          <div className="group relative bg-black border border-neutral-800 p-8 hover:border-neutral-700 transition-all overflow-hidden aspect-square flex flex-col">
            {/* Corner dots */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-neutral-600 rounded-full" />
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-neutral-600 rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl font-semibold text-white mb-3">
                Track Payments
              </h3>
              <p className="font-inter-italic text-neutral-500 text-sm leading-relaxed">
                Monitor transactions in real-time with your dashboard. See payment status, amounts, and history instantly.
              </p>

              {/* Visual element - Document lines */}
              <div className="flex-1 flex items-center justify-center my-6">
                <div className="relative w-28 h-32 border border-neutral-700 group-hover:border-neutral-500 transition-colors p-3">
                  {/* Document lines */}
                  <div className="w-full h-1.5 bg-neutral-700 mb-2" />
                  <div className="w-3/4 h-1.5 bg-neutral-700 mb-2" />
                  <div className="w-full h-1.5 bg-neutral-700 mb-2" />
                  <div className="w-2/3 h-1.5 bg-neutral-700 mb-2" />
                  <div className="w-full h-1.5 bg-neutral-700 mb-2" />
                  <div className="w-1/2 h-1.5 bg-neutral-700" />
                </div>
              </div>

              <button className="font-bricolage w-full px-6 py-3 border border-neutral-800 hover:border-[#fe330a] hover:bg-[#fe330a] hover:text-white text-sm font-medium text-white transition-all uppercase tracking-wider">
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
