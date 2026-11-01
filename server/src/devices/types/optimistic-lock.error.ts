/** Raised by the repository when a version-guarded update matches no row. */
export class OptimisticLockError extends Error {
  constructor(message = 'Version mismatch (concurrent modification)') {
    super(message);
    this.name = 'OptimisticLockError';
  }
}
