import { NextRequest, NextResponse } from 'next/server';
import { getContentById, updateContent } from '@/lib/store';
import { publishToSpreaker } from '@/lib/spreaker';

// POST /api/content/[id]/approve - Approve content and publish
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
    
    const channels = body.channels || item.channels;
    const publishResults: Record<string, unknown> = {};
    const errors: string[] = [];
    
    // Check if Spreaker publishing is requested
    const publishToSpreakerChannel = channels.includes('spreaker') || channels.includes('podcast');
    
    if (publishToSpreakerChannel && item.audioUrl) {
      try {
        console.log(`[APPROVE] Publishing to Spreaker: ${item.title}`);
        
        // Parse tags from metadata or use provided
        const tags = body.spreaker?.tags || 
          (item.metadata?.tags ? item.metadata.tags.split(',').map((t: string) => t.trim()) : []);
        
        const result = await publishToSpreaker({
          title: body.spreaker?.title || item.title,
          description: body.spreaker?.description || item.description,
          audioUrl: item.audioUrl,
          thumbnailUrl: item.thumbnailUrl,
          tags,
          spreaker: {
            isNewShow: body.spreaker?.isNewShow ?? false,
            showId: body.spreaker?.showId ? Number(body.spreaker.showId) : undefined,
            category_id: body.spreaker?.category_id ? Number(body.spreaker.category_id) : undefined,
            category_2_id: body.spreaker?.category_2_id ? Number(body.spreaker.category_2_id) : undefined,
            category_3_id: body.spreaker?.category_3_id ? Number(body.spreaker.category_3_id) : undefined,
            owner_name: body.spreaker?.owner_name,
            author_name: body.spreaker?.author_name,
            copyright: body.spreaker?.copyright,
            email: body.spreaker?.email,
            website_url: body.spreaker?.website_url,
            season_number: body.spreaker?.season_number ? Number(body.spreaker.season_number) : undefined,
            episode_number: body.spreaker?.episode_number ? Number(body.spreaker.episode_number) : undefined,
            episode_type: body.spreaker?.episode_type,
            explicit: body.spreaker?.explicit ?? false,
          },
        });
        
        publishResults.spreaker = {
          success: true,
          showId: result.show.show_id,
          showUrl: result.show.site_url,
          episodeId: result.episode.episode_id,
          episodeUrl: result.episode.site_url,
        };
        
        console.log(`[APPROVE] Spreaker published: ${result.episode.site_url}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[APPROVE] Spreaker publish failed:`, error);
        errors.push(`Spreaker: ${msg}`);
        publishResults.spreaker = { success: false, error: msg };
      }
    }
    
    // TODO: Add other platform publishing (YouTube, TikTok, etc.)
    
    const updated = await updateContent(id, {
      status: errors.length > 0 && Object.keys(publishResults).length === errors.length 
        ? 'pending' // All platforms failed, keep as pending
        : 'approved',
      feedback: body.feedback,
      channels,
      metadata: {
        ...item.metadata,
        publishResults: JSON.stringify(publishResults),
        ...(errors.length > 0 ? { publishErrors: errors.join('; ') } : {}),
      },
    });
    
    console.log(`[APPROVED] ${item.title} → Channels: ${channels.join(', ')}`);
    
    return NextResponse.json({
      ...updated,
      publishResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to approve content:', error);
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}
