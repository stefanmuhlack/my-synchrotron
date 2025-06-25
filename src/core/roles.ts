// core/roles.ts
export const VALID_ROLES = ['admin', 'coach', 'coachee'] as const
export type UserRole = typeof VALID_ROLES[number]
export const isValidRole = (role: any): role is UserRole =>
  VALID_ROLES.includes(role)
