/**
 * KU Email Domain Validation Utility
 * Validates email addresses against Kasetsart University domains
 */

const KU_DOMAINS = ['@ku.th'] as const;

/**
 * Check if an email belongs to a valid KU domain
 * @param email - Email address to validate
 * @returns true if email ends with a valid KU domain
 */
export function isValidKUEmail(email: string): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  return KU_DOMAINS.some(domain => normalizedEmail.endsWith(domain));
}

/**
 * Get the KU domain from an email address
 * @param email - Email address
 * @returns The KU domain if valid, null otherwise
 */
export function getKUDomain(email: string): string | null {
  if (!email) return null;

  const normalizedEmail = email.toLowerCase().trim();
  const domain = KU_DOMAINS.find(d => normalizedEmail.endsWith(d));
  return domain || null;
}

/**
 * Generate a random 6-digit verification code
 * @returns 6-digit numeric string
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get verification code expiration time (15 minutes from now)
 * @returns Date object representing expiration time
 */
export function getVerificationExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 15);
  return expiryDate;
}

/**
 * Check if a verification code has expired
 * @param expiryDate - Expiration date to check
 * @returns true if expired
 */
export function isVerificationExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

export { KU_DOMAINS };
