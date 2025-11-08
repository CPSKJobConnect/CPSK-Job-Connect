/**
 * Validates if a value is a valid image URL for Next.js Image component
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: unknown): url is string {
  return (
    typeof url === 'string' &&
    url.trim() !== '' &&
    url.startsWith('http')
  );
}
