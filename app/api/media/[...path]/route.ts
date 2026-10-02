import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Supported MIME types
const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    if (!segments || segments.length === 0) {
      return new NextResponse('Media path not provided', { status: 400 });
    }

    // Sanitize path against directory traversal
    const safeSegments = segments.map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ''));
    const relativePath = safeSegments.join('/');

    // Check in /public/uploads first, then /data/uploads
    let fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(process.cwd(), 'data', 'uploads', relativePath);
    }

    if (!fs.existsSync(fullPath)) {
      return new NextResponse('Media file not found', { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const range = req.headers.get('range');

    // Handle HTTP 206 Partial Content (essential for HTML5 video seeking & playback)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(fullPath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Full file response
    const fileStream = fs.createReadStream(fullPath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('Media streaming error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
