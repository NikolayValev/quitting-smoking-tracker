# Next Steps for Deployment

This PR is complete and ready for deployment! Here's what you need to do:

## 1. Set Up Clerk Authentication (5 minutes)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application (or use existing)
3. Get your keys from the API Keys section:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
4. Configure sign-in/sign-up settings:
   - Enable email/password or social login
   - Set up your branding

## 2. Set Up Neon Database (5 minutes)

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Create a database (e.g., `quitting_smoking_tracker`)
4. Copy the connection string (it will look like):
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/dbname
   ```

## 3. Configure Environment Variables

### For Local Development:
Create a `.env` file in the root directory:

```bash
# Copy from .env.example and fill in your values
DATABASE_URL=postgresql://[YOUR_NEON_CONNECTION_STRING]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[YOUR_KEY]
CLERK_SECRET_KEY=sk_test_[YOUR_KEY]

# These should stay as-is for local dev
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

### For Vercel Deployment:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add each variable from above
4. For production, use `pk_live_` and `sk_live_` Clerk keys

## 4. Run Database Migrations

### Locally:
```bash
npm install --legacy-peer-deps
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
```

### On Vercel:
Migrations will need to be run manually after first deployment:
```bash
# Set DATABASE_URL to your production database
DATABASE_URL="your_production_url" npm run db:migrate
```

Or use Vercel CLI:
```bash
vercel env pull .env.production
npm run db:migrate
```

## 5. Test Locally

```bash
npm run dev
```

Visit:
- `http://localhost:3000` - Landing page
- `http://localhost:3000/demo` - Public demo (works without auth)
- `http://localhost:3000/sign-in` - Sign in page
- `http://localhost:3000/app` - Authenticated app

## 6. Deploy to Vercel

### Option A: GitHub Integration (Recommended)
1. Merge this PR to your main branch
2. Vercel will auto-deploy
3. Add environment variables in Vercel dashboard
4. Run migrations (see step 4)
5. Redeploy to pick up environment variables

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 7. Verify Deployment

After deployment, test these features:

- [ ] Landing page loads correctly
- [ ] "Try Demo" button shows demo mode
- [ ] "Save My Progress" redirects to sign-in
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Creating first log works (onboarding)
- [ ] Dashboard displays correctly
- [ ] Wellness center is accessible
- [ ] User can sign out

## 8. Optional: Configure Clerk Webhooks

For production, consider setting up webhooks to sync user data:

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.deleted`
4. This allows automatic cleanup when users delete their accounts

## Troubleshooting

### Build fails with "Clerk publishable key invalid"
- Ensure you're using real Clerk keys (dummy keys won't work)
- Check that keys match your environment (test vs production)

### "DATABASE_URL not set" error
- Add DATABASE_URL to your environment variables
- For Vercel, ensure it's set in project settings

### Google Fonts not loading
- This is expected due to network restrictions
- Fonts are commented out in `app/layout.tsx`
- Uncomment them once deployed to environment with internet access

### Demo mode works but authenticated mode doesn't
- Check Clerk keys are correctly set
- Verify DATABASE_URL points to accessible database
- Ensure migrations have been run

## Support Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs
- **Next.js App Router**: https://nextjs.org/docs/app

## Summary

Total setup time: **~15-20 minutes**

1. Create Clerk app (5 min)
2. Create Neon database (5 min)
3. Configure env vars (2 min)
4. Run migrations (3 min)
5. Deploy to Vercel (5 min)

**Your app will be live and fully functional!** 🎉
