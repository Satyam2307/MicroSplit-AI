export function hasSquadRole(
  role: string | null | undefined,
  allowedRoles?: readonly string[]
): boolean {
  return typeof role === 'string' && (!allowedRoles || allowedRoles.includes(role));
}

export function authorizationFailureStatus(
  userId: string | null | undefined,
  membershipRole?: string | null,
  allowedRoles?: readonly string[]
): 401 | 403 | null {
  if (!userId) return 401;
  if (membershipRole === undefined || membershipRole === null) return 403;
  return hasSquadRole(membershipRole, allowedRoles) ? null : 403;
}
