import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Hero from '@/components/hero';
import CreateSnapDemoSlider from '@/components/create-snap-demo-slider';
import FeaturesSection from '@/components/features-section';
import HowItWorks from '@/components/how-it-works';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section with Planet */}
      <Hero />

      {/* Create Snap & See Demo – on-click slider */}
      <CreateSnapDemoSlider />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Footer */}
      <Footer />
    </div>
  );
}
