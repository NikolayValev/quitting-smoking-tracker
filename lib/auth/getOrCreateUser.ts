import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Server-only function to get or create a user in the database based on Clerk authentication.
 * Returns the internal user ID from the database.
 */
export async function getOrCreateUser(): Promise<string> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error('Unauthorized: No user ID found');
  }

  // Try to find existing user
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0].id;
  }

  // Create new user if doesn't exist
  const newUsers = await db
    .insert(users)
    .values({ clerkUserId })
    .returning();

  return newUsers[0].id;
}
