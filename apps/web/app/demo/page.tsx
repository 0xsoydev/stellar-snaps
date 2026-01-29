import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoPage() {
  const demoSnap = {
    title: "Coffee Fund",
    description: "Buy me a coffee to support my work!",
    amount: "10",
    asset: "XLM",
    destination: "GBZX...4WMT",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <nav className="border-b border-white/10 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bricolage flex items-center gap-2">
            <img src="/stellar.png" alt="" className="h-7 w-auto" />
            <span className="font-bold text-white">Stellar Snaps</span>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="font-bricolage">Create Your Own</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            See How It Works
          </h1>
          <p className="font-inter-italic text-gray-400 text-lg">
            This is what recipients see when they click your payment link
          </p>
        </div>

        {/* Demo Card */}
        <div className="flex justify-center mb-16">
          <Card className="bg-slate-900/80 border-slate-800 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-500">✦</span>
                <CardTitle className="text-white">{demoSnap.title}</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                {demoSnap.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-inter-italic text-gray-400 text-sm mb-2 block">Amount</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white">
                    {demoSnap.amount}
                  </div>
                  <span className="text-gray-400">{demoSnap.asset}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-inter-italic text-gray-500 text-xs mb-1">Sending to</p>
                <p className="text-gray-300 text-sm font-mono">{demoSnap.destination}</p>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                Pay with Stellar
              </Button>

              <p className="font-inter-italic text-center text-gray-500 text-xs">
                Demo preview - no payment will be made
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold mb-3">
                1
              </div>
              <CardTitle className="text-white text-lg">Click Link</CardTitle>
              <CardDescription className="text-gray-400">
                Recipient opens your payment link
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-3">
                2
              </div>
              <CardTitle className="text-white text-lg">Connect Wallet</CardTitle>
              <CardDescription className="text-gray-400">
                They connect their Freighter wallet
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mb-3">
                3
              </div>
              <CardTitle className="text-white text-lg">Send Payment</CardTitle>
              <CardDescription className="text-gray-400">
                Transaction settles in seconds
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button size="lg" className="font-bricolage bg-purple-600 hover:bg-purple-700">
              Create Your First Snap →
            </Button>
          </Link>
          <p className="mt-4">
            <Link href="/" className="font-bricolage text-gray-400 hover:text-purple-400 text-sm">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
