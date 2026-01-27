# Build & Deployment Notes

## Environment Requirements

This application requires the following environment variables to be set before building:

### Required for Build
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key

### Required for Runtime
- `DATABASE_URL` - Your Neon Postgres connection string
- All Clerk environment variables listed in `.env.example`

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in your actual Clerk and Neon credentials
3. Run `npm install --legacy-peer-deps`
4. Run `npm run db:generate` to generate migrations
5. Run `npm run db:migrate` to apply migrations
6. Run `npm run dev` to start development server

## Production Build

The build process requires valid Clerk credentials to complete successfully. Ensure all environment variables are properly configured in your deployment platform (e.g., Vercel, Railway, etc.).

```bash
npm run build
```

## Known Build Issues

1. **Google Fonts**: The build may fail if Google Fonts cannot be accessed. This is resolved by commenting out unused font imports in `app/layout.tsx`.

2. **Clerk Validation**: Clerk validates the publishable key format during build time. Dummy keys will not work - you must use real credentials from your Clerk dashboard.

3. **Database Connection**: While the app allows builds without DATABASE_URL (using a dummy connection), pages that query the database will need a real connection to function properly.

## Demo Mode

The `/demo` route does not require authentication or database access and can be tested immediately after deployment without any credentials.
