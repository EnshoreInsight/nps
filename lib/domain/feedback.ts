import { addHours } from "date-fns";
import { ContactPreference, UrgencyLevel } from "@prisma/client";

export function calculateUrgencyLevel(
  score: number,
  contactRequested: ContactPreference,
): UrgencyLevel {
  // The business rules map customer sentiment and contact preference into a fixed urgency tier.
  if (score <= 6 && contactRequested === ContactPreference.YES) {
    return UrgencyLevel.LEVEL_1;
  }

  if (score <= 6 && contactRequested === ContactPreference.NO) {
    return UrgencyLevel.LEVEL_2;
  }

  if (score >= 7 && contactRequested === ContactPreference.YES) {
    return UrgencyLevel.LEVEL_3;
  }

  return UrgencyLevel.LEVEL_4;
}

export function calculateSlaDueAt(urgencyLevel: UrgencyLevel, from = new Date()) {
  // Only direct-contact cases carry a response SLA.
  switch (urgencyLevel) {
    case UrgencyLevel.LEVEL_1:
      return addHours(from, 24);
    case UrgencyLevel.LEVEL_3:
      return addHours(from, 72);
    default:
      return null;
  }
}

export function urgencyLabel(level: UrgencyLevel) {
  return level.replace("_", " ").replace("_", " ");
}

export function sentimentLabel(score: number) {
  if (score >= 9) return "Promoter";
  if (score >= 7) return "Passive";
  return "Detractor";
}

export function sentimentVariant(score: number) {
  if (score >= 9) return "success";
  if (score >= 7) return "warning";
  return "danger";
}

export function calculateNps(scores: number[]) {
  if (!scores.length) return 0;

  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;

  return Math.round(((promoters - detractors) / scores.length) * 100);
}
