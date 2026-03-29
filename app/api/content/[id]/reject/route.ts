import { NextRequest, NextResponse } from 'next/server';
import { getContentById, updateContent } from '@/lib/store';

// POST /api/content/[id]/reject - Reject content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const item = await getContentById(id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    if (item.status !== 'pending') {
      return NextResponse.json(
        { error: 'Content has already been reviewed' },
        { status: 400 }
      );
    }
    
    const updated = await updateContent(id, {
      status: 'rejected',
      feedback: body.feedback,
    });
    
    console.log(`[REJECTED] ${item.title} - Feedback: ${body.feedback || 'None'}`);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to reject content:', error);
    return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
  }
}
