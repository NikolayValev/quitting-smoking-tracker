# Quit Smoking Tracker - Wellness & Smoking Cessation App

A comprehensive wellness application designed to help users on their smoke-free journey. Features personalized tracking, breathing exercises, urge resistance tools, and motivational support.

## Features

- **Progress Tracking**: Monitor smoke-free days, money saved, and cigarettes not smoked
- **Wellness Tools**: Guided breathing exercises and relaxation techniques
- **Urge Resistance**: Step-by-step coping strategies to resist cravings
- **Personalized Onboarding**: Custom setup based on individual habits
- **Milestone Celebrations**: Track and celebrate health improvements
- **Daily Tips**: Curated wellness and motivation tips
- **Google OAuth Authentication**: Secure sign-in with Google

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Testing**: Vitest + React Testing Library
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Google OAuth credentials

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables (see Vercel integration)

4. Run database migrations:
   - Execute scripts in `/scripts` folder in order

5. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

### Testing

Run tests:
\`\`\`bash
pnpm test
\`\`\`

Run tests with UI:
\`\`\`bash
pnpm test:ui
\`\`\`

Generate coverage report:
\`\`\`bash
pnpm test:coverage
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── onboarding/        # User onboarding flow
│   └── wellness/          # Wellness center
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and helpers
│   ├── data/             # Static data and content
│   └── supabase/         # Supabase client setup
├── scripts/              # Database migration scripts
└── __tests__/            # Test files

\`\`\`

## Database Schema

### Tables

- **profiles**: User profile information
- **quit_attempts**: Tracking quit smoking attempts

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data

## Deployment

This app is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure Supabase integration
3. Set up Google OAuth credentials
4. Deploy

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

## Security

- Environment variables for sensitive data
- Row Level Security (RLS) in database
- CSRF protection
- Secure authentication flow

## License

Private project - All rights reserved
