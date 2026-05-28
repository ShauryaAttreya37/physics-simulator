/**
 * Vercel serverless function - POST /api/token
 *
 * Exchanges a Discord OAuth2 authorization code for an access token.
 * The client secret is kept server-side and never exposed to the browser.
 *
 * Required environment variables (set in Vercel dashboard):
 *   DISCORD_CLIENT_ID
 *   DISCORD_CLIENT_SECRET
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body ?? {};
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Discord OAuth environment variables are not configured');
    return res.status(500).json({ error: 'Discord OAuth is not configured' });
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Discord token exchange error:', tokenRes.status, body);
      return res.status(502).json({ error: 'Discord token exchange failed' });
    }

    const { access_token: accessToken } = await tokenRes.json();

    if (!accessToken) {
      console.error('Discord token exchange response did not include access_token');
      return res.status(502).json({ error: 'Discord token exchange failed' });
    }

    return res.status(200).json({ access_token: accessToken });
  } catch (error) {
    console.error('Discord token exchange request failed:', error);
    return res.status(502).json({ error: 'Discord token exchange failed' });
  }
}
