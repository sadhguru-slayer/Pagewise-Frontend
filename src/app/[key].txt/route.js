import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const requestedKeyWithTxt = resolvedParams?.key; // e.g. "my_key" when route is [key].txt
  const expectedKey = process.env.INDEXNOW_KEY;

  if (!expectedKey) {
    return new NextResponse('IndexNow key not configured on server', { status: 404 });
  }

  // The segment will match the key portion before .txt
  if (requestedKeyWithTxt === expectedKey || requestedKeyWithTxt === `${expectedKey}.txt`) {
    return new NextResponse(expectedKey, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  }

  return new NextResponse('Key mismatch', { status: 404 });
}
