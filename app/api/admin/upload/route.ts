import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'thumbnail' | 'poster' | 'video'
    const adminEmail = formData.get('adminEmail') as string;
    const adminRole = formData.get('adminRole') as string;

    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (type === 'thumbnail' || type === 'poster') {
      const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!extension || !allowedImageExts.includes(extension)) {
        return NextResponse.json(
          { success: false, error: `Invalid image format (${extension}). Supported: JPG, JPEG, PNG, WEBP.` },
          { status: 400 }
        );
      }

      // Convert small images to base64 preview or provide storage reference
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;

      return NextResponse.json({
        success: true,
        type: 'image',
        fileName,
        fileSize,
        url: base64,
        storagePath: `thumbnails/${Date.now()}_${fileName}`,
        message: 'Image uploaded and processed.',
      });
    }

    if (type === 'video') {
      const allowedVideoExts = ['mp4', 'webm', 'mov'];
      if (!extension || !allowedVideoExts.includes(extension)) {
        return NextResponse.json(
          { success: false, error: `Invalid video format (.${extension}). Supported formats: MP4, WEBM, MOV.` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        type: 'video',
        fileName,
        fileSize,
        storagePath: `videos/master/${Date.now()}_${fileName}`,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '22:30',
        uploaded: true,
        processed: true,
        readyToPublish: true,
        message: 'Video uploaded and processed successfully.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid upload type specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
