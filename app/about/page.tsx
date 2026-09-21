import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { DonghuaLogo } from '@/components/DonghuaLogo';
import { ShieldCheck, Film, Globe2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-3">
          <DonghuaLogo className="w-16 h-16 mx-auto" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            About <span className="text-[#c92a2a]">Decent Animation</span>
          </h1>
          <p className="text-sm text-amber-400 font-mono">
            India&apos;s Premier Sanctuary for Chinese Animation &amp; Cultivation Epics
          </p>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed bg-[#11111a] border border-[#232334] p-6 sm:p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-500" />
            Our Vision
          </h2>
          <p>
            Decent Animation was founded with an unyielding mission: to bring the supreme artistry, breath-taking martial choreography, and deep Xianxia philosophies of Chinese animation (Donghua) to audiences across India and South Asia with authentic Hindi dubbing and master-grade English subtitles.
          </p>
          <p>
            From the celestial ascensions of Tang San in <em>Soul Land</em> to the fiery perseverance of Xiao Yan in <em>Battle Through the Heavens</em>, our platform curates legendary sagas in high-bitrate 1080p and 4K quality.
          </p>

          <h2 className="text-xl font-bold text-white flex items-center gap-2 pt-4">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Legal &amp; Licensed Content Distribution
          </h2>
          <p>
            Decent Animation operates as a legitimate streaming distributor. We partner with production studios and regional licensing agents to ensure creators are recognized and fairly compensated. Content uploaded to our servers strictly adheres to regional intellectual property laws.
          </p>

          <h2 className="text-xl font-bold text-white flex items-center gap-2 pt-4">
            <Globe2 className="w-5 h-5 text-emerald-400" />
            Designed for India
          </h2>
          <p>
            We proudly support direct Indian payment methods including UPI (Google Pay, PhonePe, Paytm), RuPay debit cards, and Indian net banking without requiring international cards or hidden subscription locks.
          </p>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
