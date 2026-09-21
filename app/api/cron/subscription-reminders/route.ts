import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendSubscriptionExpiryReminders } from '@/lib/notification-service';

export async function GET(req: NextRequest) {
  try {
    const stats = await checkAndSendSubscriptionExpiryReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error('Subscription reminder job error:', error);
    return NextResponse.json({ error: error.message || 'Reminder job execution failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const stats = await checkAndSendSubscriptionExpiryReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error('Subscription reminder job error:', error);
    return NextResponse.json({ error: error.message || 'Reminder job execution failed' }, { status: 500 });
  }
}
