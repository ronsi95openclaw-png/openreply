/**
 * Database sessions contain a User record; Credentials sessions use JWT and
 * retain the user id as `sub`. Keep that difference isolated and testable.
 */
export function getSessionUserId(
  databaseUserId: string | undefined,
  jwtSubject: string | undefined
): string | null {
  return databaseUserId ?? jwtSubject ?? null;
}
