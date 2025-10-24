export interface VerificationAssessment {
  visualChangeDetected: boolean;
  perceptualHashBefore: string;
  perceptualHashAfter: string;
  changeSignificance: "NONE" | "MINOR" | "MODERATE" | "MAJOR";
  assessmentRationale: string;
}
