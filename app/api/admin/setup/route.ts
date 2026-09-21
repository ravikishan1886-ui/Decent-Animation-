import { NextRequest, NextResponse } from 'next/server';

const DESIGNATED_ADMIN_EMAILS = [
  'videocinema80@gmail.com',
  'ranveerkrsingh165@gmail.com',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, secretKey } = body;

    const masterSecret = process.env.ADMIN_INITIAL_SECRET || 'decent_admin_seed_secret_2026';
    const isDesignated = DESIGNATED_ADMIN_EMAILS.includes(email);

    // Must match either secret key or a designated administrator email
    if (secretKey !== masterSecret && !isDesignated) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin setup secret' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} is authorized for Administrator role.`,
      role: 'admin',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
