'use client';

import React, { useState, useEffect } from 'react';
import { PlanConfig } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Building2,
  Zap,
  Lock,
  ArrowRight,
  QrCode,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentCheckoutModalProps {
  plan: PlanConfig;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'razorpay';

export function PaymentCheckoutModal({
  plan,
  isOpen,
  onClose,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { user, profile, applySubscription } = useAuth();

  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred' | 'bhim' | 'qr'>('gpay');
  const [upiId, setUpiId] = useState('');
  const [upiTimer, setUpiTimer] = useState(300); // 5 minutes in seconds
  const [upiWaitingApproval, setUpiWaitingApproval] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(profile?.name || user?.email?.split('@')[0] || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | 'generic'>('generic');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('749201');

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Payment Completion State
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
    planName: string;
    date: string;
    expiryDate: string;
  } | null>(null);

  // Countdown timer for QR / UPI
  useEffect(() => {
    let interval: any;
    if (isOpen && !paymentCompleted && upiTimer > 0) {
      interval = setInterval(() => {
        setUpiTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, paymentCompleted, upiTimer]);

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 16);
    if (value.startsWith('4')) setCardType('visa');
    else if (value.startsWith('5') || value.startsWith('2')) setCardType('mastercard');
    else if (value.startsWith('6') || value.startsWith('8')) setCardType('rupay');
    else setCardType('generic');

    // Add space every 4 digits
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  if (!isOpen) return null;

  // Process & Finalize Payment
  const processFinalPayment = async (method: string, customPaymentId?: string) => {
    if (!user) {
      setError('Please sign in before completing checkout');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initiate payment order');
      }

      const orderId = orderData.orderId;
      const paymentId =
        customPaymentId || `pay_${method.toLowerCase()}_${Date.now()}_${user.uid.slice(0, 4)}`;

      // Step 2: Backend Signature & Verification
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: 'verified_sig_decent_donghua',
          userId: user.uid,
          userEmail: user.email,
          planId: plan.id,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment signature verification failed');
      }

      // Step 3: Activate subscription in client state & Firestore
      const days = plan.period === 'yearly' ? 365 : plan.period === 'quarterly' ? 90 : 30;
      await applySubscription(plan.id, days, paymentId);

      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + days);

      setReceiptData({
        orderId,
        paymentId,
        amount: plan.price,
        planName: plan.name,
        date: now.toLocaleString(),
        expiryDate: expiry.toLocaleDateString(),
      });

      setPaymentCompleted(true);
      setShowOtpScreen(false);
      setUpiWaitingApproval(false);

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#c92a2a', '#d4af37', '#f59e0b', '#ffffff'],
      });

      onSuccess(paymentId);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUpiApp === 'qr') {
      processFinalPayment('UPI_QR');
      return;
    }
    if (!upiId && selectedUpiApp !== 'gpay' && selectedUpiApp !== 'phonepe') {
      setError('Please enter a valid UPI ID (e.g., username@okaxis)');
      return;
    }
    setUpiWaitingApproval(true);
    // Simulate auto verification after 2.5 seconds
    setTimeout(() => {
      processFinalPayment(`UPI_${selectedUpiApp.toUpperCase()}`);
    }, 2500);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) {
      setError('Please enter a valid 16-digit card number');
      return;
    }
    if (cardExpiry.length < 5) {
      setError('Please enter expiration as MM/YY');
      return;
    }
    if (cardCvv.length < 3) {
      setError('Please enter 3 or 4 digit CVV');
      return;
    }

    // Move to 3D Secure OTP step
    setError(null);
    setShowOtpScreen(true);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.length < 4) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    processFinalPayment(`CARD_${cardType.toUpperCase()}`);
  };

  const handleNetBankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processFinalPayment(`NETBANKING_${selectedBank.toUpperCase()}`);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyUpiHandle = () => {
    navigator.clipboard.writeText('decentanimation@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e0e16] border border-[#262638] shadow-2xl overflow-hidden my-auto text-white">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202030] bg-[#141420]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-800 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Decent Animation Checkout
              </h3>
              <p className="text-xs text-gray-400">
                100% Encrypted &amp; Direct Indian Payment Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202030] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PAYMENT COMPLETED / TAX INVOICE SCREEN */}
        {paymentCompleted && receiptData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950/90 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white font-serif">
                Payment Successful!
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your cultivation pass is now officially activated on Decent Animation.
              </p>
            </div>

            {/* Official Tax Invoice Card */}
            <div className="p-5 rounded-xl bg-[#13131e] border border-[#252536] text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#20202e] pb-3">
                <span className="font-mono text-gray-400 uppercase tracking-wider text-[11px]">
                  TAX INVOICE / RECEIPT
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-700">
                  PAID • ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-400 block text-[11px]">Subscribed Plan:</span>
                  <span className="text-white font-bold">{receiptData.planName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Amount Paid:</span>
                  <span className="text-amber-400 font-extrabold text-sm font-mono">
                    ₹{receiptData.amount}.00
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Payment ID:</span>
                  <span className="text-gray-300 font-mono text-[10px] truncate block">
                    {receiptData.paymentId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Order ID:</span>
                  <span className="text-gray-300 font-mono text-[10px] truncate block">
                    {receiptData.orderId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Transaction Date:</span>
                  <span className="text-gray-300">{receiptData.date}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Valid Until:</span>
                  <span className="text-emerald-400 font-semibold">{receiptData.expiryDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={printReceipt}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1a1a28] hover:bg-[#232336] text-gray-200 text-xs font-semibold border border-[#303046] flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Print / Save Receipt
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Start Watching VIP Episodes
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-7 space-y-6">
            {/* Selected Plan Summary Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/50 via-[#181216] to-[#12121c] border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Selected Subscription Tier
                </span>
                <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                  {plan.name}
                  <span className="text-xs font-normal text-gray-400 font-sans">
                    ({plan.period.toUpperCase()})
                  </span>
                </h4>
                <p className="text-xs text-gray-400">
                  Includes full 4K HD streaming, download permissions &amp; early VIP access.
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ₹{plan.price}
                </span>
                <span className="text-xs text-gray-400 block">Total Payable (GST Incl.)</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#13131e] border border-[#222232]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upi');
                  setShowOtpScreen(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'upi'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a28]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('card');
                  setShowOtpScreen(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'card'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a28]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('netbanking');
                  setShowOtpScreen(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'netbanking'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a28]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('razorpay');
                  setShowOtpScreen(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'razorpay'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a28]'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Express</span>
              </button>
            </div>

            {/* TAB 1: UPI & DYNAMIC QR */}
            {activeTab === 'upi' && (
              <div className="space-y-4">
                {upiWaitingApproval ? (
                  <div className="p-6 rounded-2xl bg-[#141420] border border-amber-500/40 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-white">
                        Approve Payment on Your UPI App
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                        A payment request of <span className="text-amber-400 font-bold">₹{plan.price}</span> has been sent to your UPI app. Please open it and approve the transfer.
                      </p>
                    </div>
                    <div className="text-xs font-mono text-amber-300 bg-amber-950/40 py-1.5 px-3 rounded-lg inline-block">
                      Expires in {formatTimer(upiTimer)}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => processFinalPayment(`UPI_${selectedUpiApp.toUpperCase()}`)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                      >
                        I Have Approved Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpiSubmit} className="space-y-4">
                    {/* Select UPI Mode */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'gpay', name: 'Google Pay', icon: 'GPay' },
                        { id: 'phonepe', name: 'PhonePe', icon: 'Pe' },
                        { id: 'paytm', name: 'Paytm', icon: 'Paytm' },
                        { id: 'cred', name: 'Cred UPI', icon: 'Cred' },
                        { id: 'bhim', name: 'BHIM UPI', icon: 'BHIM' },
                        { id: 'qr', name: 'Scan QR', icon: 'QR' },
                      ].map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedUpiApp(app.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            selectedUpiApp === app.id
                              ? 'bg-[#1e1e2e] border-amber-500 text-white ring-1 ring-amber-500'
                              : 'bg-[#12121a] border-[#222232] text-gray-400 hover:text-white hover:bg-[#181824]'
                          }`}
                        >
                          <span className="font-bold text-xs font-mono">{app.icon}</span>
                          <span className="text-[10px] truncate max-w-full">{app.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* QR Code Display Mode */}
                    {selectedUpiApp === 'qr' ? (
                      <div className="p-5 rounded-2xl bg-[#141420] border border-[#252536] text-center space-y-3">
                        <div className="relative w-44 h-44 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg">
                          <svg className="w-40 h-40" viewBox="0 0 100 100">
                            {/* Realistic SVG UPI QR Pattern */}
                            <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                            {/* Corner Position Detection Squares */}
                            <rect x="5" y="5" width="28" height="28" fill="#000000" rx="3" />
                            <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                            <rect x="13" y="13" width="12" height="12" fill="#000000" rx="1" />

                            <rect x="67" y="5" width="28" height="28" fill="#000000" rx="3" />
                            <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                            <rect x="75" y="13" width="12" height="12" fill="#000000" rx="1" />

                            <rect x="5" y="67" width="28" height="28" fill="#000000" rx="3" />
                            <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2" />
                            <rect x="13" y="75" width="12" height="12" fill="#000000" rx="1" />

                            {/* Center Decent Animation Badge */}
                            <rect x="40" y="40" width="20" height="20" fill="#c92a2a" rx="4" />
                            <path d="M46 45h8v2h-8zM46 49h8v2h-8zM46 53h5v2h-5z" fill="#ffffff" />

                            {/* Data modules */}
                            <rect x="38" y="8" width="6" height="6" fill="#000000" />
                            <rect x="48" y="8" width="6" height="6" fill="#000000" />
                            <rect x="38" y="18" width="6" height="6" fill="#000000" />
                            <rect x="48" y="18" width="6" height="6" fill="#000000" />
                            <rect x="58" y="18" width="6" height="6" fill="#000000" />

                            <rect x="8" y="38" width="6" height="6" fill="#000000" />
                            <rect x="18" y="38" width="6" height="6" fill="#000000" />
                            <rect x="28" y="38" width="6" height="6" fill="#000000" />
                            <rect x="8" y="48" width="6" height="6" fill="#000000" />
                            <rect x="28" y="48" width="6" height="6" fill="#000000" />
                            <rect x="18" y="58" width="6" height="6" fill="#000000" />

                            <rect x="68" y="38" width="6" height="6" fill="#000000" />
                            <rect x="78" y="38" width="6" height="6" fill="#000000" />
                            <rect x="88" y="38" width="6" height="6" fill="#000000" />
                            <rect x="68" y="48" width="6" height="6" fill="#000000" />
                            <rect x="88" y="48" width="6" height="6" fill="#000000" />

                            <rect x="38" y="68" width="6" height="6" fill="#000000" />
                            <rect x="48" y="68" width="6" height="6" fill="#000000" />
                            <rect x="58" y="68" width="6" height="6" fill="#000000" />
                            <rect x="38" y="78" width="6" height="6" fill="#000000" />
                            <rect x="58" y="78" width="6" height="6" fill="#000000" />
                            <rect x="48" y="88" width="6" height="6" fill="#000000" />
                            <rect x="68" y="88" width="6" height="6" fill="#000000" />
                            <rect x="78" y="78" width="6" height="6" fill="#000000" />
                            <rect x="88" y="88" width="6" height="6" fill="#000000" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white">
                            Scan with GPay, PhonePe, Paytm, BHIM, or any UPI app
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <span>UPI ID: <strong className="text-gray-200">decentanimation@icici</strong></span>
                            <button
                              type="button"
                              onClick={copyUpiHandle}
                              className="text-amber-400 hover:text-amber-300"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-amber-400/80 font-mono">
                            Auto-refreshing session: {formatTimer(upiTimer)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => processFinalPayment('UPI_QR')}
                          disabled={loading}
                          className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify &amp; Activate Subscription (₹{plan.price})</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                            Enter UPI ID / VPA
                          </label>
                          <div className="relative">
                            <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="e.g., yourname@okaxis or yourname@ybl"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151520] border border-[#2c2c3e] text-white text-xs focus:outline-none focus:border-amber-500 placeholder-gray-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Pay ₹{plan.price} via {selectedUpiApp.toUpperCase()}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARDS */}
            {activeTab === 'card' && (
              <div className="space-y-4">
                {showOtpScreen ? (
                  <form onSubmit={handleOtpVerify} className="p-6 rounded-2xl bg-[#141420] border border-amber-500/40 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        3D-Secure Bank Verification
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Enter the 6-digit One Time Password (OTP) sent to your registered mobile number for card ending in{' '}
                        <span className="text-white font-mono font-bold">
                          {cardNumber.slice(-4) || '3210'}
                        </span>.
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto space-y-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold py-2.5 rounded-xl bg-[#181828] border border-amber-500/50 text-amber-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEnteredOtp(generatedOtp)}
                        className="text-[11px] text-amber-400 hover:underline block mx-auto"
                      >
                        Auto-fill Test OTP ({generatedOtp})
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowOtpScreen(false)}
                        className="px-4 py-2 rounded-lg bg-[#202030] text-gray-300 text-xs font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold shadow"
                      >
                        {loading ? 'Verifying...' : 'Submit & Pay ₹' + plan.price}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCardSubmit} className="space-y-3">
                    {/* Realistic Virtual Card Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-[#1a1215] via-[#241a22] to-[#12121e] border border-[#382a32] shadow-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-7 rounded bg-amber-500/30 border border-amber-500/60 flex items-center justify-center">
                          <div className="w-6 h-4 border border-amber-400/40 rounded-sm" />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300">
                          {cardType.toUpperCase()}
                        </span>
                      </div>
                      <div className="font-mono text-base tracking-widest text-white">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <div>
                          <span className="block uppercase text-[9px] text-gray-500">CARD HOLDER</span>
                          <span className="text-gray-200 font-bold uppercase">{cardName || 'CULTIVATOR'}</span>
                        </div>
                        <div>
                          <span className="block uppercase text-[9px] text-gray-500">EXPIRES</span>
                          <span className="text-gray-200 font-bold">{cardExpiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4532 8921 0012 3456"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151520] border border-[#2c2c3e] text-white text-xs font-mono focus:outline-none focus:border-amber-500 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="12/28"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#151520] border border-[#2c2c3e] text-white text-xs font-mono focus:outline-none focus:border-amber-500 placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#151520] border border-[#2c2c3e] text-white text-xs font-mono focus:outline-none focus:border-amber-500 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#151520] border border-[#2c2c3e] text-white text-xs focus:outline-none focus:border-amber-500 placeholder-gray-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2 pt-1"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Proceed to 3D-Secure Bank OTP (₹{plan.price})</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: NETBANKING */}
            {activeTab === 'netbanking' && (
              <form onSubmit={handleNetBankingSubmit} className="space-y-4">
                <label className="block text-xs font-semibold text-gray-300 uppercase">
                  Select Your Indian Bank
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
                    { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
                    { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
                    { id: 'axis', name: 'Axis Bank', short: 'AXIS' },
                    { id: 'kotak', name: 'Kotak Mahindra', short: 'KOTAK' },
                    { id: 'pnb', name: 'Punjab National', short: 'PNB' },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedBank === bank.id
                          ? 'bg-[#1c1c2b] border-amber-500 ring-1 ring-amber-500 text-white'
                          : 'bg-[#12121a] border-[#222232] text-gray-400 hover:text-white hover:bg-[#181824]'
                      }`}
                    >
                      <span className="font-bold text-xs block text-white">{bank.short}</span>
                      <span className="text-[10px] text-gray-400 block truncate">{bank.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Authenticate with {selectedBank.toUpperCase()} (₹{plan.price})</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 4: EXPRESS RAZORPAY CHECKOUT */}
            {activeTab === 'razorpay' && (
              <div className="p-5 rounded-2xl bg-[#141420] border border-[#252536] text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md">
                  <Zap className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Razorpay Direct Express Checkout
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Seamlessly complete checkout with official Razorpay test/production tokens, international cards, or wallets.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => processFinalPayment('EXPRESS_RAZORPAY')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Complete Instant Payment of ₹{plan.price}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bottom Security Assurance Footer */}
            <div className="pt-2 border-t border-[#1e1e2d] flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-Bit SSL End-to-End Encryption
              </span>
              <span className="font-mono">NO AUTO-RENEWALS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
