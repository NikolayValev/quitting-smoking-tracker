# Deployment Checklist for nikolayvalev.com

## Environment Variables to Add

Add these to your Vercel project or hosting platform:

\`\`\`env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://ygcblgluayqupelmmrgs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Production Site URL
NEXT_PUBLIC_SITE_URL=https://nikolayvalev.com
\`\`\`

## Google Cloud Console Setup

### 1. OAuth Consent Screen
- Go to: [Google Cloud Console → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
- **Authorized domains**: Add only `nikolayvalev.com` (remove Supabase URL)

### 2. OAuth Client Credentials
- Go to: [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
- Edit your Web application OAuth client
- **Authorized JavaScript origins**:
  \`\`\`
  https://nikolayvalev.com
  http://localhost:3000 (for dev only)
  \`\`\`
- **Authorized redirect URIs**:
  \`\`\`
  https://nikolayvalev.com/auth/callback
  http://localhost:3000/auth/callback (for dev only)
  \`\`\`
- **Remove all Supabase URLs** from both sections

## Supabase Dashboard Setup

### Authentication → URL Configuration
- Go to: [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/ygcblgluayqupelmmrgs/auth/url-configuration)
- **Site URL**: `https://nikolayvalev.com`
- **Redirect URLs**: Add these:
  \`\`\`
  https://nikolayvalev.com/auth/callback
  https://nikolayvalev.com/**
  http://localhost:3000/auth/callback
  \`\`\`

### Authentication → Providers → Google
- Keep your existing Client ID and Client Secret
- The callback URL shown is the Supabase one - that's normal, don't change it

## Testing Steps

1. **Test locally first**:
   \`\`\`bash
   npm run dev
   \`\`\`
   - Go to http://localhost:3000
   - Click "Sign in with Google"
   - Should redirect to localhost callback

2. **Deploy to nikolayvalev.com**:
   - Push to GitHub
   - Vercel will auto-deploy

3. **Test production**:
   - Go to https://nikolayvalev.com
   - Click "Sign in with Google"
   - Consent screen should show **nikolayvalev.com**
   - Should successfully authenticate

## Troubleshooting

If you still see redirect_uri_mismatch:
1. Clear browser cache
2. Wait 5-10 minutes for Google's cache to update
3. Double-check all URLs match exactly (no trailing slashes)
4. Verify DNS is resolving correctly: `nslookup nikolayvalev.com`
5. Check Vercel deployment logs for any errors

## The Flow After Setup

1. User visits `https://nikolayvalev.com`
2. Clicks "Sign in with Google"
3. Google consent shows **nikolayvalev.com** ✅
4. After consent, redirects to `https://nikolayvalev.com/auth/callback`
5. Your Next.js app exchanges code with Supabase server-side
6. User is authenticated and redirected to dashboard
