import React from 'react';
import Link from 'next/link';
import { DonghuaLogo } from './DonghuaLogo';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#07070a] border-t border-[#1a1a24] text-gray-400 text-sm mt-20 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2.5">
              <DonghuaLogo className="w-7 h-7" />
              <span className="font-bold text-white text-base tracking-wide">
                DECENT <span className="text-[#c92a2a]">ANIMATION</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              India&apos;s premier streaming sanctuary for authentic Chinese animation, Xianxia cultivation epics, and high-fidelity Hindi/English dubbed Donghua.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              100% Licensed &amp; Curated
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-amber-500/90 font-mono">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/browse" className="hover:text-white transition-colors">
                  All Donghua Series
                </Link>
              </li>
              <li>
                <Link href="/browse?filter=free" className="hover:text-white transition-colors">
                  Free to Watch
                </Link>
              </li>
              <li>
                <Link href="/browse?filter=vip" className="hover:text-white transition-colors">
                  VIP Cultivator Exclusives
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="hover:text-white transition-colors">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-amber-500/90 font-mono">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Decent Animation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy &amp; DMCA
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security Notice */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-2 text-amber-500/90 font-mono">
              Secure Indian Payments
            </h4>
            <p className="text-xs text-gray-400">
              Payments powered via verified UPI, RuPay, Netbanking &amp; Credit Cards. Zero storage of raw card credentials.
            </p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0e15] border border-[#20202e] text-[11px] text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit SSL Encrypted &amp; Razorpay Verified</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#171722] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Decent Animation. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Donghua Cultivators
          </p>
        </div>
      </div>
    </footer>
  );
}
