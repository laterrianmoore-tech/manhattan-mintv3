import { NextRequest, NextResponse } from 'next/server';

// Next.js App Router API route for Jobber OAuth callback (for Vercel or any Next host)
// Environment variables expected:
// - JOBBER_CLIENT_ID
// - JOBBER_CLIENT_SECRET
// - JOBBER_OAUTH_REDIRECT_URI_PROD (must match the URL registered with Jobber, e.g., https://your-domain.com/api/jobber-auth-callback)
// - SITE_URL (used for redirecting to a success page)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if (error) {
      return new NextResponse(`Jobber auth error: ${error}`, { status: 400 });
    }
    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 });
    }

    const tokenResp = await fetch('https://api.getjobber.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.JOBBER_CLIENT_ID,
        client_secret: process.env.JOBBER_CLIENT_SECRET,
        redirect_uri: process.env.JOBBER_OAUTH_REDIRECT_URI_PROD,
      }),
    });

    if (!tokenResp.ok) {
      const t = await tokenResp.text();
      return new NextResponse(`Token exchange failed: ${t}`, { status: 500 });
    }

    const tokens = await tokenResp.json();
    // TODO: Persist tokens securely (Vercel KV / external store). Not stored in this demo.

    const redirectTo = `${process.env.SITE_URL || ''}/booking/connected`;
    return NextResponse.redirect(redirectTo);
  } catch (e: any) {
    return new NextResponse(`Callback crash: ${e.message}`, { status: 500 });
  }
}
