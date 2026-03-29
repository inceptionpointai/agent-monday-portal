import { NextResponse } from 'next/server';
import { getCategories, getShows, SpreakerCategory } from '@/lib/spreaker';

/**
 * GET /api/spreaker - Get Spreaker categories and shows for dropdown selection
 */
export async function GET() {
  try {
    // Fetch categories and shows in parallel
    const [categories, shows] = await Promise.all([
      getCategories().catch(e => {
        console.error('Failed to fetch categories:', e);
        return [];
      }),
      getShows().catch(e => {
        console.error('Failed to fetch shows:', e);
        return [];
      }),
    ]);
    
    // Filter to top-level categories only (level 1)
    const topCategories = categories.filter(c => c.level === 1);
    
    // Get subcategories organized by parent
    const subCategories: Record<number, SpreakerCategory[]> = {};
    categories.forEach(c => {
      if (c.level === 2) {
        // Find parent by checking if name starts with parent category
        const parent = topCategories.find(p => c.permalink.startsWith(p.permalink));
        if (parent) {
          if (!subCategories[parent.category_id]) {
            subCategories[parent.category_id] = [];
          }
          subCategories[parent.category_id].push(c);
        }
      }
    });
    
    return NextResponse.json({
      categories: topCategories.map(c => ({
        id: c.category_id,
        name: c.name,
        subcategories: subCategories[c.category_id] || [],
      })),
      shows: shows.map(s => ({
        id: s.show_id,
        title: s.title,
        imageUrl: s.image_url,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch Spreaker data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Spreaker data' },
      { status: 500 }
    );
  }
}
