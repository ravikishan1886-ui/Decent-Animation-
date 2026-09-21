'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SubscriptionPricing } from '@/components/SubscriptionPricing';

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1">
        <SubscriptionPricing />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
