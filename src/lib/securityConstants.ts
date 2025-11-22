export const INTERNAL_JWT_AUDIENCE = process.env.INTERNAL_JWT_AUDIENCE || "cpsk-job-connect";
export const INTERNAL_JWT_ISSUER = process.env.INTERNAL_JWT_ISSUER || "cpsk-job-connect-auth";
export const INTERNAL_JWT_TOKEN_TYPE = process.env.INTERNAL_JWT_TOKEN_TYPE || "session";
export const GOOGLE_OAUTH_PROVIDER = "google";

export function getRefreshTokenPepper() {
  const pepper = process.env.REFRESH_TOKEN_PEPPER || process.env.NEXTAUTH_SECRET;
  if (!pepper) {
    throw new Error("REFRESH_TOKEN_PEPPER or NEXTAUTH_SECRET must be configured to hash OAuth refresh tokens.");
  }
  return pepper;
}
