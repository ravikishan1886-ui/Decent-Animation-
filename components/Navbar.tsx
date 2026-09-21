'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DonghuaLogo } from './DonghuaLogo';
import { AdminLoginModal } from './AdminLoginModal';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  Sparkles,
  Crown,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Tv,
  Upload,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, isSubscriptionActive, subscriptionTier, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  const handleUploadClick = () => {
    if (user && isAdmin) {
      router.push('/admin?tab=upload');
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Browse', href: '/browse' },
    { label: 'Search', href: '/search' },
    { label: 'Subscriptions', href: '/subscription' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#09090c]/90 backdrop-blur-md border-b border-[#20202c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <DonghuaLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
              DECENT <span className="text-[#c92a2a] drop-shadow-[0_0_8px_rgba(201,42,42,0.8)]">ANIMATION</span>
            </span>
            <span className="text-[9px] tracking-widest text-amber-500/80 uppercase font-mono">
              修仙 • 顶级国漫 • DONGHUA
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-[#1a1a24] border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                    : 'text-gray-300 hover:text-white hover:bg-[#14141e]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Upload Content Action */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-gradient-to-r from-red-950/80 via-[#221016] to-[#150d12] border border-red-700/60 hover:border-amber-500/70 hover:shadow-[0_0_15px_rgba(201,42,42,0.35)] transition-all ml-1"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Content</span>
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/60 transition-colors shadow-[0_0_12px_rgba(201,42,42,0.25)]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Action Controls & Auth */}
        <div className="flex items-center space-x-3">
          <Link
            href="/search"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a24] transition-colors md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full bg-[#15151f] border border-[#2b2b3b] hover:border-amber-500/40 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-900 to-amber-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-amber-500/20">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-xs">
                  <p className="font-semibold text-gray-200 leading-none truncate max-w-[90px]">
                    {profile?.name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-amber-400 font-mono mt-0.5 uppercase">
                    {isAdmin ? 'Admin' : isSubscriptionActive ? subscriptionTier : 'Free'}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {userDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-[#12121a] border border-[#2c2c3e] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setUserDropdown(false)}
                >
                  <div className="px-4 py-2 border-b border-[#222230]">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    {isSubscriptionActive ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Crown className="w-3 h-3 text-amber-400" />
                        {subscriptionTier} Plan Active
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[10px] text-gray-400">No active plan</span>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a28] transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    User Dashboard
                  </Link>

                  <Link
                    href="/subscription"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a28] transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    My Subscription
                  </Link>

                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-amber-300 hover:text-amber-200 hover:bg-[#1f1520] transition-colors text-left font-semibold"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Upload Content
                  </button>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-950/40 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-400" />
                      Admin Control Panel
                    </Link>
                  )}

                  <div className="border-t border-[#222230] my-1" />

                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-200 hover:text-white hover:bg-[#171722] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#c92a2a] to-[#a01616] hover:from-[#e03131] hover:to-[#b01818] transition-all shadow-[0_0_15px_rgba(201,42,42,0.4)]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a24]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0c12] border-b border-[#252535] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-200 hover:text-white hover:bg-[#181824]"
            >
              {link.label}
            </Link>
          ))}
          {/* Upload Content Button in Mobile Drawer */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleUploadClick();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base font-bold text-amber-300 bg-red-950/30 border border-red-800/40 text-left"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            Upload Content
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-red-300 bg-red-950/40 border border-red-900/40"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}

      {/* Admin Login Modal (Triggered when non-admin clicks Upload Content) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setShowAdminLoginModal(false);
          router.push('/admin?tab=upload');
        }}
      />
    </header>
  );
}
