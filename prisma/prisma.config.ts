import { definePrismaConfig } from '@prisma/internals';

export default definePrismaConfig({
  datasource: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
      // directUrl: process.env.DIRECT_URL, // Uncomment if needed for CLI or migration tools
    },
  },
});
