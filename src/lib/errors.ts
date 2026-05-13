export function getErrorMessage(error: unknown, fallback = "Unknown error") {
  return error instanceof Error ? error.message : fallback;
}

export function hasErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
