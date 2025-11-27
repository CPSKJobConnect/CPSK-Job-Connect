#!/usr/bin/env node
/**
 * Approve a company by account email (for E2E tests).
 * Usage: node scripts/approve-company.js company@example.com
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/approve-company.js <company-email>');
    process.exit(2);
  }

  try {
    const account = await prisma.account.findUnique({ where: { email } });
    if (!account) {
      console.error('Account not found for email:', email);
      process.exit(3);
    }

    const company = await prisma.company.findUnique({ where: { account_id: account.id } });
    if (!company) {
      console.error('Company not found for account:', account.id);
      process.exit(4);
    }

    await prisma.company.update({
      where: { id: company.id },
      data: { registration_status: 'APPROVED', verified_at: new Date() },
    });

    console.log('Company approved:', company.id);
    process.exit(0);
  } catch (err) {
    console.error('Error approving company:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
