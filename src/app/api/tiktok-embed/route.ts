import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate TikTok URL
  const tiktokUrlPattern = /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/;
  if (!tiktokUrlPattern.test(url)) {
    return NextResponse.json({ error: 'Invalid TikTok URL' }, { status: 400 });
  }

  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(/\/video\/(\d+)/);
    if (!videoIdMatch) {
      return NextResponse.json({ error: 'Could not extract video ID' }, { status: 400 });
    }

    const videoId = videoIdMatch[1];

    // Create embed HTML
    const embedHtml = `
      <blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;">
        <section>
          <a target="_blank" title="@user" href="${url}">@user</a>
        </section>
      </blockquote>
    `;

    return NextResponse.json({ html: embedHtml });
  } catch (error) {
    console.error('Error creating TikTok embed:', error);
    return NextResponse.json({ error: 'Failed to create embed' }, { status: 500 });
  }
}