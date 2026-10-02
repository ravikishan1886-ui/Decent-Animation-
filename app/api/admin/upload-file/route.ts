import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const config = {
  api: {
    bodyParser: false, // For streaming if needed
  },
};

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
    const type = (formData.get('type') as string) || 'video'; // 'video' | 'thumbnail'
    const seriesSlug = (formData.get('seriesSlug') as string) || 'general';
    const videoId = (formData.get('videoId') as string) || `vid_${Date.now()}`;
    const adminEmail = (formData.get('adminEmail') as string) || req.headers.get('x-admin-email') || '';
    const adminRole = (formData.get('adminRole') as string) || '';

    // Verify admin access
    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Only administrators can upload media files.' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No media file provided for upload.' },
        { status: 400 }
      );
    }

    const originalName = file.name || 'unnamed_file';
    const cleanName = sanitizeFileName(originalName);
    const extension = cleanName.split('.').pop()?.toLowerCase() || '';

    // Validation by file type
    if (type === 'video') {
      const allowedVideoExts = ['mp4', 'webm', 'mkv', 'mov'];
      if (!extension || !allowedVideoExts.includes(extension)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid video format (.${extension}). Supported formats: .mp4, .webm, .mkv, .mov`,
          },
          { status: 400 }
        );
      }
    } else if (type === 'thumbnail') {
      const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!extension || !allowedImageExts.includes(extension)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid image format (.${extension}). Supported formats: .jpg, .jpeg, .png, .webp`,
          },
          { status: 400 }
        );
      }
    }

    const subDir = type === 'video' ? 'videos' : 'thumbnails';
    const targetDir = path.join(process.cwd(), 'public', 'uploads', subDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueFileName = `${videoId}_${Date.now()}_${cleanName}`;
    const destinationPath = path.join(targetDir, uniqueFileName);

    // Stream and write file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    const fileSizeBytes = buffer.length;
    const formattedSize = formatBytes(fileSizeBytes);

    // Persistent URL served by Next.js streaming API
    const downloadUrl = `/api/media/${subDir}/${uniqueFileName}`;
    const storagePath = `${subDir}/${seriesSlug}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      storagePath,
      fileName: originalName,
      fileSize: formattedSize,
      fileSizeBytes,
      contentType: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('File upload error in /api/admin/upload-file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Server encountered an error while writing upload file.',
      },
      { status: 500 }
    );
  }
}
