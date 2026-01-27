import { db } from './index';
import { users, smokeLogs } from './schema';

async function seed() {
  console.log('Seeding database...');

  // This is a placeholder seed script
  // In a real scenario, you might want to add some test data here
  // For now, we'll just log that seeding is complete

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed!', err);
  process.exit(1);
});
