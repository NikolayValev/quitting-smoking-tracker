# Fix Google OAuth Redirect URI Mismatch

## The Problem
Google is receiving `https://ygcblgluayqupelmmrgs.supabase.co/auth/v1/callback` but you want it to use `https://smoking.nikolayvalev.com/auth/callback`.

## Step-by-Step Fix

### 1. Add Environment Variable to Vercel
Go to your Vercel project settings → Environment Variables and add:
\`\`\`
NEXT_PUBLIC_SITE_URL=https://smoking.nikolayvalev.com
\`\`\`
**Important:** Redeploy after adding this variable.

### 2. Configure Supabase Dashboard

#### A. URL Configuration (Authentication → URL Configuration)
- **Site URL:** `https://smoking.nikolayvalev.com`
- **Redirect URLs:** Add these (one per line):
  \`\`\`
  https://smoking.nikolayvalev.com/**
  http://localhost:3000/**
  \`\`\`

#### B. Google Provider Settings (Authentication → Providers → Google)
Make sure your Google Client ID and Secret are entered here.

### 3. Configure Google Cloud Console

#### A. OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Under "Authorized domains", add:
   \`\`\`
   nikolayvalev.com
   \`\`\`
3. Remove any `.supabase.co` domains if present

#### B. OAuth 2.0 Client ID
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your Web application OAuth client
3. **Authorized JavaScript origins:**
   \`\`\`
   https://smoking.nikolayvalev.com
   http://localhost:3000
   \`\`\`
4. **Authorized redirect URIs:**
   \`\`\`
   https://smoking.nikolayvalev.com/auth/callback
   http://localhost:3000/auth/callback
   \`\`\`
5. **REMOVE** any Supabase URLs (`.supabase.co`) from both sections
6. Click "Save"

### 4. Test the Flow

1. Clear your browser cache and cookies
2. Go to `https://smoking.nikolayvalev.com/auth/login`
3. Click "Continue with Google"
4. You should see your domain (`smoking.nikolayvalev.com`) on the Google consent screen
5. After authorizing, you'll be redirected back to your app

### 5. Verify It's Working

Check the browser console logs when clicking the Google sign-in button. You should see:
\`\`\`
[v0] OAuth redirect URL: https://smoking.nikolayvalev.com/auth/callback
\`\`\`

If you still see errors:
- Make sure the environment variable is deployed
- Wait a few minutes for Google's cache to update
- Try in an incognito/private browser window

## How It Works

1. User clicks "Continue with Google" on your app
2. Supabase redirects to Google with `redirect_uri=https://smoking.nikolayvalev.com/auth/callback`
3. Google shows consent screen with your domain
4. User authorizes
5. Google redirects to `https://smoking.nikolayvalev.com/auth/callback?code=...`
6. Your Next.js callback route receives the code
7. Server-side, it exchanges the code with Supabase for a session
8. User is redirected to dashboard with active session

The key is that Google never sees the Supabase URL - it only sees your custom domain.
