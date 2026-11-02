/** Whole days an OUT consignment is past due; 0 for resolved or not-yet-due. */
export function daysOverdue(
  dueDate: string,
  statusCode: string,
  now: Date = new Date()
): number {
  if (statusCode !== "OUT") return 0
  const diff = now.getTime() - new Date(dueDate).getTime()
  return diff > 0 ? Math.floor(diff / 86_400_000) : 0
}
