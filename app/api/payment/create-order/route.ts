import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SUBSCRIPTION_PLANS } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userId, userEmail } = body;

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 404 });
    }

    // Convert INR price to paise (Razorpay standard: ₹99 = 9900 paise)
    const amountInPaise = plan.price * 100;
    const orderReceipt = `rcpt_${userId.slice(0, 6)}_${Date.now()}`;

    // If production Razorpay Key and Secret are set, create real Razorpay order via Razorpay API
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      razorpayKeyId &&
      razorpayKeySecret &&
      !razorpayKeyId.includes('placeholder') &&
      !razorpayKeySecret.includes('placeholder')
    ) {
      // Call official Razorpay Orders API
      const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderReceipt,
          notes: {
            userId,
            userEmail: userEmail || '',
            planId: plan.id,
            planName: plan.name,
          },
        }),
      });

      if (!rzpResponse.ok) {
        const errorData = await rzpResponse.json();
        console.error('Razorpay order creation failed:', errorData);
        return NextResponse.json({ error: errorData.error?.description || 'Failed to create Razorpay order' }, { status: 502 });
      }

      const orderData = await rzpResponse.json();
      return NextResponse.json({
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: razorpayKeyId,
        plan,
      });
    }

    // Secure Test/Development order generation
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return NextResponse.json({
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId || 'rzp_test_decentdonghua',
      plan,
      isTestMode: true,
      note: 'Using Decent Animation Secure Test Gateway. To connect real Razorpay, supply RAZORPAY_KEY_SECRET in Settings.',
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
