import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { isAdmin: false, error: 'Email is required for admin authorization check.' },
        { status: 400 }
      );
    }

    const hasAdminPrivilege = verifyAdminAccess(email, role);

    if (!hasAdminPrivilege) {
      return NextResponse.json(
        {
          isAdmin: false,
          error: "Access Denied: You don't have permission to access the Admin Portal.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      email,
      message: 'Admin authorization confirmed.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Authorization check failed' },
      { status: 500 }
    );
  }
}
