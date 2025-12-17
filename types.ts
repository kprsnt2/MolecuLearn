
export type Condition = 'Diabetes' | 'High Blood Pressure' | 'Asthma' | 'Kidney Disease' | 'Heart Disease' | 'Liver Issues' | 'None';

export interface UserProfile {
  id: string;
  age: number;
  weight: number;
  conditions: Condition[];
  allergies: string[];
  currentMedications: string[];
  lastUpdated: string;
}

export interface SafetyWarning {
  severity: 'Critical' | 'Moderate' | 'Low';
  reason: string;
  recommendation: string;
}

export interface DrugCandidate {
  name: string;
  type: 'Original' | 'Existing Alternative' | 'Novel Analog' | 'Natural Compound';
  chemicalFormula: string;
  molecularWeight: string;
  smiles: string;
  mechanismOfAction: string;
  sideEffects: string[];
  efficacyScore: number;
  safetyScore: number;
  improvementNotes: string;
  personalSafetyWarnings: SafetyWarning[]; // Personalized for user
}

export interface AnalysisResult {
  targetDrug: string;
  candidates: DrugCandidate[];
  profileCheckSummary: string;
}

export enum ViewMode {
  GRID = 'GRID',
  CHART = 'CHART',
}

export type Language = 'en' | 'te';
