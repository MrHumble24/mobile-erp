/** True when the error is a Prisma unique-constraint violation (code P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

/** The columns of a P2002 unique violation (Prisma `meta.target`), or []. */
export function uniqueViolationFields(error: unknown): string[] {
  if (!isUniqueViolation(error)) return [];
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  if (Array.isArray(target))
    return target.filter((t): t is string => typeof t === 'string');
  return typeof target === 'string' ? [target] : [];
}
