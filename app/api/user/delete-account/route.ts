import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { isDesignatedAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail, confirmationText } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required to delete account' }, { status: 401 });
    }

    if (confirmationText !== 'DELETE') {
      return NextResponse.json({ error: 'Please enter "DELETE" to confirm account deletion' }, { status: 400 });
    }

    // Safety guard: Prevent accidental deletion of designated root administrator account
    if (isDesignatedAdmin(userEmail)) {
      return NextResponse.json({ error: 'Root Administrator accounts cannot be deleted directly.' }, { status: 403 });
    }

    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    return NextResponse.json({
      success: true,
      message: 'Your account record and personal data have been completely deleted.',
    });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: err.message || 'Account deletion failed' }, { status: 500 });
  }
}
