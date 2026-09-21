'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DonghuaLogo } from '@/components/DonghuaLogo';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { resetPassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await resetPassword(email);
      setStatus('success');
      setMessage('A password reset link has been dispatched to your email address.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to dispatch reset email. Please ensure your email is correct.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#11111a] border border-[#232334] shadow-2xl relative">
          <div className="text-center space-y-2 mb-6">
            <DonghuaLogo className="w-12 h-12 mx-auto" />
            <h1 className="text-2xl font-extrabold text-white font-serif">Restore Dao Key</h1>
            <p className="text-xs text-gray-400">
              Enter your email to receive an official password reset talisman
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs space-y-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p>{message}</p>
              <Link
                href="/login"
                className="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {status === 'error' && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cultivator@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181824] border border-[#2c2c3e] text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#c92a2a] to-amber-600 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
              >
                {status === 'loading' ? 'Dispatching...' : 'Send Password Reset Email'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
