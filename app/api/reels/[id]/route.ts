import { NextRequest, NextResponse } from 'next/server';
import { readReelsFromStore, writeReelsToStore } from '@/lib/reel-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reels = readReelsFromStore();
    const reel = reels.find((r) => r.id === id);
    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ reel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reels = readReelsFromStore();
    const index = reels.findIndex((r) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    const existing = reels[index];
    const updated = {
      ...existing,
      ...body,
      hashtags: Array.isArray(body.hashtags)
        ? body.hashtags
        : typeof body.hashtags === 'string'
        ? body.hashtags.split(' ').filter(Boolean)
        : existing.hashtags,
      updatedAt: new Date().toISOString(),
    };

    reels[index] = updated;
    writeReelsToStore(reels);

    return NextResponse.json({ success: true, reel: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let reels = readReelsFromStore();
    const existing = reels.find((r) => r.id === id);

    if (!existing) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    reels = reels.filter((r) => r.id !== id);
    writeReelsToStore(reels);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
