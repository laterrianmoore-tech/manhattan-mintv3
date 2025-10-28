// netlify/functions/jobber-auth-callback.js
export const handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) return { statusCode: 400, body: `Jobber auth error: ${error}` };
    if (!code) return { statusCode: 400, body: 'Missing authorization code' };

    const tokenResp = await fetch('https://api.getjobber.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.JOBBER_CLIENT_ID,
        client_secret: process.env.JOBBER_CLIENT_SECRET,
        redirect_uri: process.env.JOBBER_OAUTH_REDIRECT_URI_PROD, // live URL
      }),
    });
    if (!tokenResp.ok) {
      const t = await tokenResp.text();
      return { statusCode: 500, body: `Token exchange failed: ${t}` };
    }
    const tokens = await tokenResp.json(); // { access_token, refresh_token, ... }
    // TODO: persist tokens securely (Netlify KV / external store). For now, continue.
    const redirectTo = `${process.env.SITE_URL}/booking/connected`;
    return { statusCode: 302, headers: { Location: redirectTo }, body: '' };
  } catch (e) {
    return { statusCode: 500, body: `Callback crash: ${e.message}` };
  }
};