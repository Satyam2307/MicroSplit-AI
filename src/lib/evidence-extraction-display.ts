export const DATE_INTERPRETATION_WARNING_PREFIX =
  "Date could not be interpreted.";

export function getContributionWarnings(flagsJson: string | null): string[] {
  if (!flagsJson) return [];
  try {
    const parsed: unknown = JSON.parse(flagsJson);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function getContributionDateWarning(flagsJson: string | null): string | null {
  return (
    getContributionWarnings(flagsJson).find((warning) =>
      warning.startsWith(DATE_INTERPRETATION_WARNING_PREFIX)
    ) ?? null
  );
}

export function getExtractionDisplayStatus(
  status: string,
  contributions: readonly { flagsJson: string | null }[]
): string {
  if (
    status === "extraction_completed" &&
    contributions.some((contribution) =>
      getContributionDateWarning(contribution.flagsJson)
    )
  ) {
    return "Extraction completed with warnings";
  }
  return status;
}
