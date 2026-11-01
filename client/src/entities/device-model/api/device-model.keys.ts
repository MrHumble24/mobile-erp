export const deviceModelKeys = {
  all: ["device-models"] as const,
  lists: () => [...deviceModelKeys.all, "list"] as const,
}
