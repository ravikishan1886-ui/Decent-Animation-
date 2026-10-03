import { NextRequest, NextResponse } from 'next/server';
import { incrementReelView } from '@/lib/reel-store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const newViews = incrementReelView(id);
    return NextResponse.json({ success: true, views: newViews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
