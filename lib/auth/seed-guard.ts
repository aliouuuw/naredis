/** Refuse dev seed unless explicitly allowed in production. */
export function assertDevSeedAllowed(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEV_SEED !== "true"
  ) {
    throw new Error(
      "Refusing to run dev seed in production. Set ALLOW_DEV_SEED=true only if intentional.",
    );
  }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}
