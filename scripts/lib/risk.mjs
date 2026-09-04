export const riskDimensions = [
  "blastRadius",
  "reversibility",
  "dataSecurity",
  "operationalImpact",
  "verificationGap",
  "changeSurface",
];

export function classifyRisk(scores) {
  for (const dimension of riskDimensions) {
    const score = scores[dimension];
    if (!Number.isInteger(score) || score < 0 || score > 3) {
      throw new TypeError(`${dimension} must be an integer from 0 through 3.`);
    }
  }

  const total = riskDimensions.reduce((sum, key) => sum + scores[key], 0);
  const maximumDimension = Math.max(...riskDimensions.map((key) => scores[key]));
  const band = maximumDimension === 3 || total >= 10
    ? "high"
    : maximumDimension === 2 || total >= 5
      ? "medium"
      : "low";

  return { total, maximum: 18, band, autoApprove: band === "low" && total <= 4 };
}
