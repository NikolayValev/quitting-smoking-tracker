# Google OAuth Custom Domain Setup (Proxy Method)

This app uses a **proxy callback** approach to completely hide the Supabase URL from Google OAuth.

## How It Works

1. User clicks "Sign in with Google" → Redirects to Google
2. Google redirects back to: `https://smoking.nikolayvalev.com/auth/callback`
3. Your Next.js callback route exchanges the code with Supabase **server-side**
4. Session cookies are set and user is redirected to dashboard

**Google never sees the Supabase URL** - it only interacts with your custom domain.

---

## Setup Instructions

### 1. Add Environment Variable

In your **Vercel project** or **local .env.local**:

\`\`\`bash
NEXT_PUBLIC_SITE_URL=https://smoking.nikolayvalev.com
\`\`\`

### 2. Configure Google Cloud Console

Go to: [Google Cloud Console](https://console.cloud.google.com/)

#### A. OAuth Consent Screen
- Navigate to: **APIs & Services → OAuth consent screen**
- Under **Authorized domains**, add ONLY:
  \`\`\`
  nikolayvalev.com
  \`\`\`
- **Remove** any Supabase domains (ygcblgluayqupelmmrgs.supabase.co)

#### B. OAuth Client Credentials
- Navigate to: **APIs & Services → Credentials**
- Select your **OAuth 2.0 Client ID** (Web application)

**Authorized JavaScript origins:**
\`\`\`
https://smoking.nikolayvalev.com
http://localhost:3000
\`\`\`

**Authorized redirect URIs:**
\`\`\`
https://smoking.nikolayvalev.com/auth/callback
http://localhost:3000/auth/callback
\`\`\`

**DO NOT** include any Supabase URLs here. That's what causes the Supabase domain to appear on the consent screen.

### 3. Configure Supabase

Go to: [Supabase Dashboard](https://supabase.com/dashboard)

#### A. URL Configuration
- Navigate to: **Authentication → URL Configuration**

**Site URL:**
\`\`\`
https://smoking.nikolayvalev.com
\`\`\`

**Redirect URLs (add these):**
\`\`\`
https://smoking.nikolayvalev.com/**
https://smoking.nikolayvalev.com/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
\`\`\`

#### B. Google Provider (Keep existing settings)
- Navigate to: **Authentication → Providers → Google**
- Keep your Google Client ID and Client Secret as-is
- The callback URL shown will be the Supabase one, but it's only used server-side

### 4. Deploy & Test

1. **Deploy to Vercel** with the environment variable set
2. **Wait 5-10 minutes** for Google's OAuth cache to update
3. Visit: `https://smoking.nikolayvalev.com/auth/login`
4. Click "Continue with Google"
5. Check the consent screen - it should show **smoking.nikolayvalev.com** ✅

---

## Troubleshooting

### Still seeing Supabase URL?
- Clear browser cache and cookies
- Wait for Google's cache to update (can take up to 24 hours)
- Verify NO Supabase URLs exist in Google Cloud Console

### Error: redirect_uri_mismatch?
- Ensure `https://smoking.nikolayvalev.com/auth/callback` is in Google's authorized redirect URIs
- Check spelling and HTTPS protocol
- Verify the domain is live and accessible

### Session not persisting?
- Check that cookies are being set (inspect browser DevTools → Application → Cookies)
- Verify middleware is refreshing sessions

---

## The Flow (Visual)

\`\`\`
User clicks "Sign in"
        ↓
Google OAuth (sees only: smoking.nikolayvalev.com)
        ↓
Consent screen shows: smoking.nikolayvalev.com ✅
        ↓
Google redirects to: smoking.nikolayvalev.com/auth/callback?code=xxx
        ↓
Your Next.js route exchanges code with Supabase (server-side)
        ↓
Session established → User redirected to dashboard
\`\`\`

Google never communicates with Supabase directly - your app acts as a proxy.
