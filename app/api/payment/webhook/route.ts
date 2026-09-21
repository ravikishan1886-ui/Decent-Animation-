import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('Webhook signature mismatch in Decent Animation payment hook');
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log('Received Razorpay Webhook Event:', event.event);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const { userId, planId } = notes;

      console.log(`Server-side Webhook: Payment captured for user ${userId}, plan ${planId}`);
      // In production webhook, update Firestore subscription status
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
