# Google OAuth Custom Domain Setup Guide

This guide explains how to configure Google OAuth to show your custom domain (nikolayvalev.com) instead of the Supabase URL on the consent screen.

## Problem
By default, Google OAuth consent screens show your Supabase project URL (e.g., `ygcblgluayqupelmmrgs.supabase.co`), which looks unprofessional and confusing to users.

## Solution
Configure Google Cloud Console to use only your custom domain, and set up your app to handle the OAuth callback before forwarding to Supabase.

---

## Step 1: Configure Google Cloud Console - OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services → OAuth consent screen**

### Add Authorized Domains
In the "Authorized domains" section, add **ONLY** your real domain(s):

\`\`\`
nikolayvalev.com
\`\`\`

If you use subdomains for auth:
\`\`\`
nikolayvalev.com
auth.nikolayvalev.com
\`\`\`

**Important:** Do NOT add `ygcblgluayqupelmmrgs.supabase.co` here. Remove it if it exists.

---

## Step 2: Configure OAuth Client Credentials

1. In Google Cloud Console, go to **APIs & Services → Credentials**
2. Click on your OAuth 2.0 Client ID (Web application type)

### Update Authorized JavaScript Origins
Remove the Supabase URL and add only your domain(s):

\`\`\`
https://nikolayvalev.com
http://localhost:3000
\`\`\`

If using auth subdomain:
\`\`\`
https://auth.nikolayvalev.com
https://nikolayvalev.com
http://localhost:3000
\`\`\`

### Update Authorized Redirect URIs
Replace the Supabase callback URL with your custom domain callbacks:

**Production:**
\`\`\`
https://nikolayvalev.com/auth/callback
\`\`\`

**Development:**
\`\`\`
http://localhost:3000/auth/callback
\`\`\`

**Important:** Do NOT include `https://ygcblgluayqupelmmrgs.supabase.co/auth/v1/callback` in this list.

---

## Step 3: Configure Your Application

Your app is already set up correctly! The callback flow is:

1. User clicks "Sign in with Google"
2. Google redirects to: `https://nikolayvalev.com/auth/callback?code=...`
3. Your Next.js route handler (`app/auth/callback/route.ts`) processes the code
4. The route exchanges the code with Supabase server-side
5. User is redirected to `/dashboard` with session established

### Environment Variables

Make sure these are set in your Vercel project:

**For Production:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- Do NOT set `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` in production

**For Development:**
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: `http://localhost:3000/auth/callback`

The login page already uses this logic:
\`\`\`typescript
redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
\`\`\`

---

## Step 4: Deploy Your Custom Domain

1. **Add Custom Domain in Vercel:**
   - Go to your Vercel project settings
   - Navigate to **Domains**
   - Add `nikolayvalev.com` (or your desired domain)
   - Configure DNS as instructed by Vercel

2. **Wait for DNS Propagation:**
   - Typically takes 5-15 minutes
   - Verify with: `nslookup nikolayvalev.com`

3. **Test HTTPS:**
   - Visit `https://nikolayvalev.com`
   - Ensure SSL certificate is active (Vercel handles this automatically)

---

## Step 5: Update Supabase (Optional)

In your Supabase Dashboard:

1. Go to **Authentication → URL Configuration**
2. Add your custom domain to **Site URL**: `https://nikolayvalev.com`
3. Add to **Redirect URLs**:
   \`\`\`
   https://nikolayvalev.com/auth/callback
   http://localhost:3000/auth/callback
   \`\`\`

Note: You don't need to change the OAuth provider settings in Supabase since your app handles the callback server-side.

---

## Step 6: Clear Cache and Test

Google's OAuth consent screen caches domain information. After making changes:

1. **Clear Browser Cache:** Clear cookies and cache for Google accounts
2. **Test in Incognito:** Use an incognito/private window to test
3. **Wait for Propagation:** It may take 10-30 minutes for Google to update

### Testing Checklist

- [ ] Visit your app at `https://nikolayvalev.com`
- [ ] Click "Sign in with Google"
- [ ] Verify the consent screen shows `nikolayvalev.com` (not Supabase URL)
- [ ] Complete OAuth flow and verify redirect to dashboard works
- [ ] Check that session is established and user data loads

---

## Troubleshooting

### Still Seeing Supabase URL on Consent Screen

1. **Double-check Google Cloud Console:**
   - OAuth consent screen → Authorized domains should NOT contain Supabase URL
   - OAuth client → JavaScript origins should NOT contain Supabase URL
   - OAuth client → Redirect URIs should NOT contain Supabase URL

2. **Clear Google's Cache:**
   - Revoke your app's access at https://myaccount.google.com/permissions
   - Try signing in again

3. **Verify Domain is Live:**
   - Ensure `https://nikolayvalev.com` resolves correctly
   - Check that SSL certificate is valid

### OAuth Error: redirect_uri_mismatch

- Verify the redirect URI in Google Cloud matches exactly: `https://nikolayvalev.com/auth/callback`
- Check for trailing slashes (should not have one)
- Ensure the protocol matches (https vs http)

### Session Not Established After Callback

- Check Vercel deployment logs for errors
- Verify Supabase environment variables are set correctly
- Ensure middleware is running (check `middleware.ts`)

---

## Summary

Once configured:

✅ Google OAuth consent screen shows `nikolayvalev.com`
✅ Users trust the domain they see
✅ OAuth flow works seamlessly through your custom domain
✅ Supabase URL is never exposed to end users
✅ All authentication happens server-side for security

Your app is already structured correctly for this setup. You just need to configure Google Cloud Console and deploy to your custom domain.
