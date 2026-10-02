import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminAccess } from '@/lib/admin-auth';

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'video'; // 'thumbnail' | 'poster' | 'video'
    const adminEmail = (formData.get('adminEmail') as string) || req.headers.get('x-admin-email') || '';
    const adminRole = (formData.get('adminRole') as string) || '';

    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received for upload.' }, { status: 400 });
    }

    const fileName = file.name || 'uploaded_media';
    const cleanName = sanitizeFileName(fileName);
    const extension = cleanName.split('.').pop()?.toLowerCase();

    if (type === 'thumbnail' || type === 'poster') {
      const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!extension || !allowedImageExts.includes(extension)) {
        return NextResponse.json(
          { success: false, error: `Invalid image format (${extension}). Supported: JPG, JPEG, PNG, WEBP.` },
          { status: 400 }
        );
      }

      const targetDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const uniqueName = `thumb_${Date.now()}_${cleanName}`;
      const dest = path.join(targetDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(dest, buffer);

      const downloadUrl = `/api/media/thumbnails/${uniqueName}`;

      return NextResponse.json({
        success: true,
        type: 'image',
        fileName,
        fileSize: formatBytes(buffer.length),
        url: downloadUrl,
        storagePath: `thumbnails/${uniqueName}`,
        message: 'Image uploaded and processed successfully.',
      });
    }

    if (type === 'video') {
      const allowedVideoExts = ['mp4', 'webm', 'mov', 'mkv'];
      if (!extension || !allowedVideoExts.includes(extension)) {
        return NextResponse.json(
          { success: false, error: `Invalid video format (.${extension}). Supported formats: MP4, WEBM, MOV, MKV.` },
          { status: 400 }
        );
      }

      const targetDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const uniqueName = `vid_${Date.now()}_${cleanName}`;
      const dest = path.join(targetDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(dest, buffer);

      const downloadUrl = `/api/media/videos/${uniqueName}`;

      return NextResponse.json({
        success: true,
        type: 'video',
        fileName,
        fileSize: formatBytes(buffer.length),
        storagePath: `videos/master/${uniqueName}`,
        streamUrl: downloadUrl,
        downloadUrl,
        videoUrl: downloadUrl,
        uploaded: true,
        processed: true,
        readyToPublish: true,
        message: 'Video file physically uploaded and stored permanently.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid upload type specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
