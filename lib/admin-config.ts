export const DESIGNATED_ADMIN_EMAILS = [
  'videocinema80@gmail.com',
  'ranveerkrsingh165@gmail.com',
];

export function isDesignatedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return DESIGNATED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
