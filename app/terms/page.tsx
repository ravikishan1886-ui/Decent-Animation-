import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white font-serif">
          Terms & Conditions
        </h1>
        <p className="text-xs text-gray-400 font-mono">Last revised: September 2026</p>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#11111a] border border-[#232334] p-6 sm:p-8 rounded-2xl">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or subscribing to Decent Animation, you agree to be bound by these Terms and Conditions and all applicable Indian copyright and digital streaming regulations.
          </p>

          <h2 className="text-base font-bold text-white pt-2">2. Subscription and Payments</h2>
          <p>
            Subscriptions are purchased for specified periods (Monthly, 3 Months, or 1 Year). All transactions are processed through Razorpay India. We do not automatically charge your payment methods upon plan expiry unless an explicit recurring mandate is opted in by you.
          </p>

          <h2 className="text-base font-bold text-white pt-2">3. Video Access & Protected Downloads</h2>
          <p>
            Paid and exclusive video episodes are cryptographically licensed for personal, non-commercial streaming. Downloads permitted under Premium or VIP plans are strictly for offline individual consumption on your authorized devices. Re-uploading, mirroring, ripping, or circumventing DRM/authorization controls constitutes a material breach of terms.
          </p>

          <h2 className="text-base font-bold text-white pt-2">4. Content Ownership & Rights</h2>
          <p>
            All Chinese animation video works, trademarks, and logos are property of their respective production studios or licensed distributors. Decent Animation respects all intellectual property rights.
          </p>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
