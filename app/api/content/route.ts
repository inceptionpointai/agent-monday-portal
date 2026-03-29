import { NextRequest, NextResponse } from 'next/server';
import { getAllContent, addContent, deleteContent, deleteMultiple, cleanupNoVideo } from '@/lib/store';

// GET /api/content - List all content
export async function GET() {
  try {
    const items = await getAllContent();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to get content:', error);
    return NextResponse.json({ error: 'Failed to get content' }, { status: 500 });
  }
}

// Known creators and their required voice IDs
const CREATOR_VOICE_MAP: Record<string, string> = {
  'agent-monday': '', // Voice ID to be assigned
  'monday': '', // Voice ID to be assigned
};

// POST /api/content - Submit new content for review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.creator) {
      return NextResponse.json(
        { error: 'Missing required fields: title, creator' },
        { status: 400 }
      );
    }
    
    // Voice validation for known creators
    const creatorKey = body.creator?.toLowerCase().replace(/\s+/g, '-');
    const expectedVoiceId = CREATOR_VOICE_MAP[creatorKey];
    
    if (expectedVoiceId) {
      // This is a known creator - validate voice ID
      const submittedVoiceId = body.voiceId || body.metadata?.voiceId;
      
      if (!submittedVoiceId) {
        return NextResponse.json(
          { error: `Content from ${body.creator} requires voiceId field for validation` },
          { status: 400 }
        );
      }
      
      if (submittedVoiceId !== expectedVoiceId) {
        return NextResponse.json(
          { error: `Voice ID mismatch for ${body.creator}. Expected ${expectedVoiceId}, got ${submittedVoiceId}` },
          { status: 400 }
        );
      }
    }
    
    // Content type validation - ensure media matches content type
    // UNLESS it's a draft (script/idea for review before asset generation)
    const contentType = body.contentType?.toLowerCase() || '';
    const channels = (body.channels || []).map((c: string) => c.toLowerCase());
    const isDraft = body.isDraft === true || body.status === 'draft';
    
    // Skip media validation for drafts - they're just ideas/scripts for review
    if (!isDraft) {
      // Podcasts require audio
      const isPodcast = contentType === 'podcast' || 
                        channels.includes('podcast') || 
                        channels.includes('spreaker');
      if (isPodcast && !body.audioUrl) {
        return NextResponse.json(
          { error: 'Podcast content requires audioUrl (use isDraft: true for script review)' },
          { status: 400 }
        );
      }
      
      // Video platforms require video
      const isVideo = contentType === 'tiktok' || 
                      contentType === 'youtube-short' || 
                      contentType === 'youtube-long' ||
                      channels.includes('youtube') ||
                      channels.includes('youtube-shorts') ||
                      channels.includes('tiktok') ||
                      channels.includes('instagram-reels');
      if (isVideo && !body.videoUrl) {
        return NextResponse.json(
          { error: 'Video content requires videoUrl (use isDraft: true for script review)' },
          { status: 400 }
        );
      }
      
      // Static Instagram posts require image
      const isStaticInstagram = (contentType === 'instagram-post' || 
                                 channels.includes('instagram')) &&
                                !channels.includes('instagram-reels');
      if (isStaticInstagram && !body.imageUrl && !body.thumbnailUrl) {
        return NextResponse.json(
          { error: 'Instagram post requires imageUrl or thumbnailUrl' },
          { status: 400 }
        );
      }
    }
    
    const newItem = await addContent({
      title: body.title,
      description: body.description || '',
      contentType: body.contentType,
      videoUrl: body.videoUrl,
      audioUrl: body.audioUrl,
      imageUrl: body.imageUrl,
      thumbnailUrl: body.thumbnailUrl,
      creator: body.creator,
      channels: body.channels || [],
      cost: body.cost,
      duration: body.duration,
      metadata: body.metadata,
      isDraft: isDraft,
    });
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to add content:', error);
    return NextResponse.json({ error: 'Failed to add content' }, { status: 500 });
  }
}

// DELETE /api/content - Delete content items
// Supports: ?id=xxx (single), ?ids=xxx,yyy,zzz (multiple), ?cleanup=no-video (bulk cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');
    const cleanup = searchParams.get('cleanup');
    
    // Bulk cleanup: remove items without video
    if (cleanup === 'no-video') {
      const result = await cleanupNoVideo();
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${result.deleted} items without video`,
        deleted: result.deleted,
        remaining: result.remaining
      });
    }
    
    // Delete multiple by IDs
    if (ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
      const deletedCount = await deleteMultiple(idList);
      return NextResponse.json({
        success: true,
        deleted: deletedCount,
        requested: idList.length
      });
    }
    
    // Delete single by ID
    if (id) {
      const deleted = await deleteContent(id);
      if (!deleted) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: id });
    }
    
    return NextResponse.json(
      { error: 'Missing parameter: id, ids, or cleanup' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to delete content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
