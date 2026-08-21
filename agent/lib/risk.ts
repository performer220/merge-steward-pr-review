export const riskDimensions = [
  "blastRadius",
  "reversibility",
  "dataSecurity",
  "operationalImpact",
  "verificationGap",
  "changeSurface",
] as const;

export type RiskDimension = (typeof riskDimensions)[number];
export type RiskScores = Record<RiskDimension, number>;

export function classifyRisk(scores: RiskScores) {
  const total = riskDimensions.reduce((sum, key) => sum + scores[key], 0);
  const hasCriticalDimension = riskDimensions.some((key) => scores[key] === 3);

  const band = hasCriticalDimension || total >= 10
    ? "high"
    : total >= 5
      ? "medium"
      : "low";

  return {
    total,
    maximum: 18,
    band,
    // A single score of 2 is enough to require a human even when the sum is low.
    autoApprove: band === "low" && riskDimensions.every((key) => scores[key] <= 1),
  } as const;
}
