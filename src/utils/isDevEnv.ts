export function isDevEnv(): boolean {
  const maybeProcess = (
    globalThis as unknown as { process?: { env?: { NODE_ENV?: unknown } } }
  ).process;

  const nodeEnv = maybeProcess?.env?.NODE_ENV;
  if (typeof nodeEnv !== "string") return false;
  return nodeEnv !== "production";
}
