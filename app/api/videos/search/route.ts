import { NextRequest, NextResponse } from 'next/server';
import { queryDonghuaVideos } from '@/lib/search-service';
import { SortOption } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || 'All';
    const accessType = searchParams.get('accessType') || 'All';
    const language = searchParams.get('language') || 'All';
    const sort = (searchParams.get('sort') as SortOption) || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const result = await queryDonghuaVideos({
      q,
      genre,
      accessType,
      language,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search API route error:', error);
    return NextResponse.json({ error: error.message || 'Search execution failed' }, { status: 500 });
  }
}
