export function formatPostedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return "Today";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
}


export function getDiffDays(dateStr: string): number {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}