import passwordDenylistSource from "@/lib/data/top-3000-common-passwords.json";

// Top 3,000 passwords (filtered to match our password policy length) sourced from
// the UK NCSC "100k most used passwords" dataset (https://www.ncsc.gov.uk).

const normalizedEntries = (passwordDenylistSource as string[])
  .map((entry) => entry.trim().toLowerCase())
  .filter((entry) => entry.length > 0);

export const PASSWORD_DENYLIST = new Set(normalizedEntries);

export const PASSWORD_DENYLIST_SIZE = PASSWORD_DENYLIST.size;

export function isPasswordInDenylist(password: string) {
  return PASSWORD_DENYLIST.has(password.trim().toLowerCase());
}
