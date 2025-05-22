export function assertUnreachable(value: never) {
  throw new Error("Invalid value: " + value);
}
