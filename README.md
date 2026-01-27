# Quit Smoking Tracker - Wellness & Smoking Cessation App

A comprehensive wellness application designed to help users on their smoke-free journey. Features personalized tracking, breathing exercises, urge resistance tools, and motivational support.

## Demo vs Authenticated Mode

This application supports two distinct modes of operation:

### 🎭 **Public Demo Mode** (No Sign-In Required)
- **Access**: Available at `/demo`
- **Purpose**: Allows recruiters and visitors to explore the full UI with realistic sample data
- **Data**: Read-only view of pre-seeded journey data (90 days of progress)
- **Features**: Browse stats, timeline, and milestones without authentication
- **Storage**: Data loaded from static JSON file (`data/demoLogs.json`)

### 🔐 **Authenticated Mode** (User-Specific)
- **Access**: Requires sign-in via Clerk authentication
- **Purpose**: Personal tracking with persistent data storage
- **Data**: User-specific smoke logs stored in Neon Postgres database
- **Features**: Full CRUD operations - create, read, update, delete logs
- **Storage**: Secure server-side database with row-level isolation

## Features

- **Progress Tracking**: Monitor smoke-free days, money saved, and cigarettes not smoked
- **Wellness Tools**: Guided breathing exercises and relaxation techniques
- **Urge Resistance**: Step-by-step coping strategies to resist cravings
- **Personalized Onboarding**: Custom setup based on individual habits
- **Milestone Celebrations**: Track and celebrate health improvements
- **Daily Tips**: Curated wellness and motivation tips
- **Dual Mode Access**: Public demo + authenticated personal tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: Neon Postgres
- **ORM**: Drizzle ORM
- **Authentication**: Clerk (@clerk/nextjs)
- **Testing**: Vitest + React Testing Library
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon database account (or compatible PostgreSQL)
- Clerk account for authentication

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```bash
   # Database (Neon Postgres)
   DATABASE_URL=postgresql://user:password@host/database

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx

   # Clerk URLs (use these exact values for local development)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
   ```

4. Set up the database:
   ```bash
   # Generate migration files
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # (Optional) Seed with initial data
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Visit the application:
   - Landing page: `http://localhost:3000`
   - Demo mode: `http://localhost:3000/demo`
   - Authenticated app: `http://localhost:3000/app` (requires sign-in)

### Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm test:ui
```

Generate coverage report:
```bash
npm test:coverage
```

## Project Structure

```
├── app/                     # Next.js app directory
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   ├── demo/               # Public demo mode
│   ├── app/                # Authenticated app entry
│   ├── dashboard/          # Main dashboard
│   ├── onboarding/         # User onboarding flow
│   └── wellness/           # Wellness center
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── ...                # Feature components
├── db/                     # Database layer
│   ├── schema.ts          # Drizzle ORM schema
│   ├── index.ts           # Database client
│   ├── migrate.ts         # Migration runner
│   └── seed.ts            # Seed script
├── lib/                    # Utilities and helpers
│   ├── auth/              # Authentication helpers
│   └── data/              # Static data and content
├── data/                   # Static data files
│   └── demoLogs.json      # Demo mode sample data
├── drizzle/               # Generated migration files (gitignored)
├── middleware.ts          # Clerk auth middleware
└── __tests__/             # Test files
```

## Database Schema

### Tables

#### `users`
- `id` (UUID, primary key, auto-generated)
- `clerk_user_id` (text, unique, not null)
- `created_at` (timestamptz, default now())

#### `smoke_logs`
- `id` (UUID, primary key, auto-generated)
- `user_id` (UUID, foreign key → users.id, not null)
- `ts` (timestamptz, default now(), not null)
- `cigarettes` (integer, not null)
- `note` (text, nullable)

### Security

- **Server-side only**: All database operations executed in server components and server actions
- **Row-level isolation**: Each user can only access their own logs via `getOrCreateUser()` helper
- **No client-side DB access**: Database credentials never exposed to the browser
- **Clerk authentication**: Secure, managed auth with session handling
- **Demo mode safety**: Demo data loaded from static JSON, no write operations allowed

## API / Server Actions

All CRUD operations are implemented as Next.js server actions in `app/app/actions.ts`:

- **`getLogs()`**: Fetch all logs for the authenticated user
- **`createLog(data)`**: Create a new smoke log entry
  - Validates input with Zod schema
  - Auto-associates with authenticated user
- **`deleteLog(data)`**: Delete a log by ID
  - Ensures log belongs to the user before deletion

### Input Validation

Uses Zod schemas for type-safe validation:
```typescript
createLogSchema = {
  cigarettes: number (int, min 0),
  note: string (optional),
  ts: datetime string (optional, defaults to now)
}
```

## Deployment

This app is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - Add Neon `DATABASE_URL`
   - Add Clerk keys
4. Vercel will auto-detect Next.js and deploy
5. Run migrations on production database:
   ```bash
   DATABASE_URL="<production-url>" npm run db:migrate
   ```

## Accessibility

- ARIA labels and roles throughout
- Semantic HTML elements
- Keyboard navigation support
- Screen reader compatible
- Color contrast compliance

## Performance

- Optimized images with Next.js Image component
- Code splitting and lazy loading
- Server-side rendering for initial load
- Static generation where possible
- Server components by default for reduced JS bundle size

## Security Notes

✅ **Server-Side Database Access**
- All database queries executed in server components or server actions
- No database credentials exposed to client
- `getOrCreateUser()` ensures user isolation

✅ **Demo Mode**
- Read-only static data from `demoLogs.json`
- No database writes in demo mode
- Clear separation from authenticated mode

✅ **Authentication**
- Clerk handles session management
- Middleware protects `/app` and `/api/private/*` routes
- Public routes (`/`, `/demo`) accessible without auth

## License

Private project - All rights reserved
