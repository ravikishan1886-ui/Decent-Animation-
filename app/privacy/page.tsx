import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white font-serif">
          Privacy Policy & Content Protection
        </h1>
        <p className="text-xs text-gray-400 font-mono">Last updated: September 2026</p>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#11111a] border border-[#232334] p-6 sm:p-8 rounded-2xl">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            We collect your email address, display name, and watch history solely to maintain your account state and resume playback. When purchasing a subscription, payments are tokenized via Razorpay. We NEVER store raw credit card numbers, debit card PINs, or UPI credentials in our database.
          </p>

          <h2 className="text-base font-bold text-white pt-2">2. How Information is Used</h2>
          <p>
            Your information is used strictly to authenticate your sessions, enforce subscription access privileges, and prevent unauthorized video scraping.
          </p>

          <h2 className="text-base font-bold text-white pt-2">3. DMCA & Copyright Inquiries</h2>
          <p>
            If you are a copyright owner or licensing agent who believes that any Donghua content on Decent Animation infringes upon your copyright, please contact our designated legal team via our Contact page with relevant ownership documentation.
          </p>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
