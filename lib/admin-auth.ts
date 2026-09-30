export const DESIGNATED_ADMIN_EMAILS = [
  'videocinema80@gmail.com',
  'ranveerkrsingh165@gmail.com',
];

export function isDesignatedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return DESIGNATED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export const isDesignatedAdminEmail = isDesignatedAdmin;

export function verifyAdminAccess(email?: string | null, role?: string | null): boolean {
  if (!email) return false;
  return isDesignatedAdmin(email) || role === 'admin';
}
