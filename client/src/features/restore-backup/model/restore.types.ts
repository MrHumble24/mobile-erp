/** Where a restore reads from: an existing run, or a freshly staged upload. */
export type RestoreSource =
  | { kind: "run"; id: string }
  | { kind: "upload"; uploadId: string }
