'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Home, Compass, Search, Bookmark, User, Crown } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isSubscriptionActive } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Browse', href: '/browse', icon: Compass },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Plans', href: '/subscription', icon: Crown, highlight: !isSubscriptionActive },
    { label: 'Profile', href: user ? '/dashboard' : '/login', icon: User },
  ];

  // Don't show bottom nav inside full video player screen to avoid obstruction
  const isWatchPage = pathname.startsWith('/watch/');
  if (isWatchPage) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-[#1f1f2e] pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]' : ''}`} />
                {item.highlight && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
