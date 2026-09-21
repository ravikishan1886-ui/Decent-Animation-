import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SUBSCRIPTION_PLANS } from '@/lib/types';
import { verifyRazorpaySignature } from '@/lib/security';
import { handleSubscriptionPurchasedEvent } from '@/lib/notification-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userEmail,
      userName,
      planId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !userId || !planId) {
      return NextResponse.json({ error: 'Missing mandatory payment verification fields' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Server-side signature verification
    const secretKey = process.env.RAZORPAY_KEY_SECRET || 'placeholderSecretKeyForVerification';
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || 'mock_sig',
      secretKey
    );

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // Calculate subscription validity window
    const now = new Date();
    const expiry = new Date();
    if (plan.period === 'monthly') {
      expiry.setDate(now.getDate() + 30);
    } else if (plan.period === 'quarterly') {
      expiry.setDate(now.getDate() + 90);
    } else if (plan.period === 'yearly') {
      expiry.setDate(now.getDate() + 365);
    }

    const subscriptionData = {
      id: `sub_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userEmail: userEmail || '',
      planId: plan.id,
      planName: plan.name,
      planTier: plan.tier,
      status: 'active',
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: plan.price,
      currency: 'INR',
      createdAt: now.toISOString(),
    };

    // Trigger server-side subscription purchase notification to user & admin
    if (userEmail) {
      try {
        await handleSubscriptionPurchasedEvent({
          userId,
          userEmail,
          userName: userName || userEmail.split('@')[0],
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          startDate: now.toLocaleDateString('en-IN'),
          expiryDate: expiry.toLocaleDateString('en-IN'),
          watchUrl: 'https://decentanimation.com/browse',
        });
      } catch (notifErr) {
        console.warn('Subscription purchase notification warning:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription successfully activated: ${plan.name}`,
      subscription: subscriptionData,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
