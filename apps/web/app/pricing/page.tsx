'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

const consumerTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with shareable Stellar payment links.',
    highlighted: false,
    features: [
      '25 snaps per month',
      'Basic rate limits',
      'Core features',
      'Freighter wallet integration',
      'Testnet & mainnet support',
      'Community support',
    ],
    cta: 'Get Started',
    ctaLink: '/dashboard',
  },
  {
    name: 'Basic',
    price: '$9',
    period: '/month',
    description: 'For creators who need more capacity and insights.',
    highlighted: true,
    popular: true,
    features: [
      '50 snaps per month',
      'Higher rate limits',
      'Analytics dashboard',
      'Payment history tracking',
      'Email support',
      'All Free features',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/dashboard?plan=basic',
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/month',
    description: 'For power users who want the full experience.',
    highlighted: false,
    features: [
      '100 snaps per month',
      'Priority access to new features',
      'Priority support',
      'Custom branding',
      'Advanced analytics',
      'All Basic features',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/dashboard?plan=premium',
  },
];

const developerTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Build and test your Stellar payment integration.',
    highlighted: false,
    features: [
      '1 whitelisted domain',
      '100 snaps per month',
      'Full SDK access',
      'React component library',
      'Testnet support',
      'Community support',
      'API documentation',
    ],
    cta: 'Start Building',
    ctaLink: '/developers',
  },
  {
    name: 'Premium',
    price: '$49',
    period: '/month',
    description: 'For production apps and growing businesses.',
    highlighted: true,
    popular: true,
    features: [
      '3 whitelisted domains',
      '300 snaps per month',
      'Verified trust badges',
      'Webhook notifications',
      'Priority API rate limits',
      'Email & Slack support',
      'Advanced analytics',
      'All Free features',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/developers/hub?plan=premium',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large-scale deployments with custom needs.',
    highlighted: false,
    features: [
      'Unlimited whitelisted domains',
      'Custom snap limits',
      'Custom SLA (99.9% uptime)',
      'White-label solution',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise deployment option',
      'SSO/SAML authentication',
      '24/7 phone & email support',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:enterprise@stellarsnaps.io',
  },
];

const faqs = [
  {
    question: 'What is a "snap"?',
    answer: 'A snap is a shareable payment link that displays as an interactive payment card. When someone clicks your snap link, they can pay you directly using their Stellar wallet.',
  },
  {
    question: 'What\'s the difference between Consumer and Developer plans?',
    answer: 'Consumer plans are for individuals who want to create and share payment links. Developer plans are for builders who want to integrate Stellar Snaps into their own applications with whitelisted domains and SDK access.',
  },
  {
    question: 'Do you charge transaction fees?',
    answer: 'We do not charge any transaction fees on payments. You only pay your monthly subscription. The only fees are Stellar network fees (typically < $0.001 per transaction).',
  },
  {
    question: 'What is a "whitelisted domain"?',
    answer: 'Developers can register their domains to host snaps on their own websites. Whitelisted domains get verified trust badges and are recognized by our browser extension.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Yes! Annual billing gives you 2 months free. Contact us for annual pricing.',
  },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[#fe330a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'consumers' | 'developers'>('consumers');

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#fe330a] opacity-20 blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="font-bricolage text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="font-inter-italic text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Whether you're sharing payment links or building apps, we have a plan for you.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('consumers')}
              className={`font-bricolage px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'consumers'
                  ? 'bg-[#fe330a] text-white shadow-[0_0_20px_rgba(254,51,10,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Consumers
            </button>
            <button
              onClick={() => setActiveTab('developers')}
              className={`font-bricolage px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'developers'
                  ? 'bg-[#fe330a] text-white shadow-[0_0_20px_rgba(254,51,10,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Developers
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative px-6 pb-24" id="pricing">
        <div className="max-w-5xl mx-auto">
          {/* Consumer Pricing */}
          <div className={activeTab === 'consumers' ? 'block' : 'hidden'}>
            <p className="font-inter-italic text-center text-gray-400 mb-12">
              Create and share payment links with ease
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {consumerTiers.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>

          {/* Developer Pricing */}
          <div className={activeTab === 'developers' ? 'block' : 'hidden'}>
            <p className="font-inter-italic text-center text-gray-400 mb-12">
              Integrate Stellar payments into your applications
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {developerTiers.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="px-6 py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bricolage text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Compare plans
          </h2>
          <p className="font-inter-italic text-gray-400 text-center mb-12">
            See what's included in each plan
          </p>

          {/* Consumer Comparison */}
          <div className={activeTab === 'consumers' ? 'block' : 'hidden'}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="font-bricolage text-left py-4 pr-4 text-gray-400 font-medium">
                      Feature
                    </th>
                    <th className="font-bricolage text-center py-4 px-4 text-white font-semibold">Free</th>
                    <th className="font-bricolage text-center py-4 px-4 text-[#fe330a] font-semibold">Basic</th>
                    <th className="font-bricolage text-center py-4 px-4 text-white font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="font-inter-italic">
                  <TableRow feature="Snaps per month" values={['25', '50', '100']} />
                  <TableRow feature="Rate limits" values={['Basic', 'Higher', 'Priority']} />
                  <TableRow feature="Analytics" values={[false, true, true]} />
                  <TableRow feature="Custom branding" values={[false, false, true]} />
                  <TableRow feature="Priority support" values={[false, false, true]} />
                  <TableRow feature="Priority feature access" values={[false, false, true]} />
                  <TableRow feature="Support" values={['Community', 'Email', 'Priority']} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Developer Comparison */}
          <div className={activeTab === 'developers' ? 'block' : 'hidden'}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="font-bricolage text-left py-4 pr-4 text-gray-400 font-medium">
                      Feature
                    </th>
                    <th className="font-bricolage text-center py-4 px-4 text-white font-semibold">Free</th>
                    <th className="font-bricolage text-center py-4 px-4 text-[#fe330a] font-semibold">Premium</th>
                    <th className="font-bricolage text-center py-4 px-4 text-white font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="font-inter-italic">
                  <TableRow feature="Whitelisted domains" values={['1', '3', 'Unlimited']} />
                  <TableRow feature="Snaps per month" values={['100', '300', 'Custom']} />
                  <TableRow feature="Verified trust badges" values={[false, true, true]} />
                  <TableRow feature="Webhook notifications" values={[false, true, true]} />
                  <TableRow feature="White-label solution" values={[false, false, true]} />
                  <TableRow feature="Custom SLA" values={[false, false, '99.9%']} />
                  <TableRow feature="SSO/SAML" values={[false, false, true]} />
                  <TableRow feature="Support" values={['Community', 'Email & Slack', '24/7 Phone']} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24 bg-gradient-to-b from-transparent to-white/5" id="faq">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bricolage text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Frequently asked questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-xl p-6 bg-white/5 hover:border-[#fe330a]/30 transition-colors"
              >
                <h3 className="font-bricolage text-lg font-semibold text-white mb-2">
                  {faq.question}
                </h3>
                <p className="font-inter-italic text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bricolage text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="font-inter-italic text-xl text-gray-400 mb-8">
            Start for free and upgrade as you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="font-bricolage px-8 py-4 bg-[#fe330a] text-white font-medium rounded-lg shadow-[0_0_30px_rgba(254,51,10,0.4)] hover:shadow-[0_0_40px_rgba(254,51,10,0.6)] hover:bg-[#d92b08] transition-all"
            >
              Create Your First Snap
            </Link>
            <Link
              href="/developers"
              className="font-bricolage px-8 py-4 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              View Developer Docs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted: boolean;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaLink: string;
}

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border ${
        tier.highlighted
          ? 'border-[#fe330a] bg-gradient-to-b from-[#fe330a]/10 to-transparent shadow-[0_0_40px_rgba(254,51,10,0.15)]'
          : 'border-white/10 bg-white/5'
      } p-8 transition-all hover:border-[#fe330a]/50`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="font-bricolage bg-[#fe330a] text-white text-xs font-semibold px-4 py-1 rounded-full shadow-[0_0_20px_rgba(254,51,10,0.5)]">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="font-bricolage text-xl font-semibold text-white mb-2">
          {tier.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="font-bricolage text-4xl font-bold text-white">
            {tier.price}
          </span>
          {tier.period && (
            <span className="font-inter-italic text-gray-400">
              {tier.period}
            </span>
          )}
        </div>
        <p className="font-inter-italic text-sm text-gray-400 mt-3">
          {tier.description}
        </p>
      </div>

      {/* CTA Button */}
      <Link
        href={tier.ctaLink}
        className={`font-bricolage w-full py-3 px-4 rounded-lg text-center font-medium transition-all mb-8 ${
          tier.highlighted
            ? 'bg-[#fe330a] text-white hover:bg-[#d92b08] shadow-[0_0_20px_rgba(254,51,10,0.4)] hover:shadow-[0_0_30px_rgba(254,51,10,0.6)]'
            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
        }`}
      >
        {tier.cta}
      </Link>

      {/* Features */}
      <div className="flex-1">
        <p className="font-bricolage text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          What's included
        </p>
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <CheckIcon />
              <span className="font-inter-italic text-sm text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TableRow({ feature, values }: { feature: string; values: (string | boolean)[] }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-4 pr-4 text-gray-300">{feature}</td>
      {values.map((value, index) => (
        <td key={index} className="text-center py-4 px-4">
          {typeof value === 'boolean' ? (
            value ? (
              <span className="inline-flex justify-center">
                <svg className="w-5 h-5 text-[#fe330a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              <span className="text-gray-600">-</span>
            )
          ) : (
            <span className="text-gray-300">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
