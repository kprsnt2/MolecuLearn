export interface DrugCandidate {
  name: string;
  type: 'Original' | 'Existing Alternative' | 'Novel Analog' | 'Natural Compound';
  chemicalFormula: string;
  molecularWeight: string;
  mechanismOfAction: string;
  safetyProfile: string; // Text description
  sideEffects: string[];
  efficacyScore: number; // 0-100
  safetyScore: number; // 0-100
  improvementNotes: string; // Why is this better?
}

export interface AnalysisResult {
  targetDrug: string;
  candidates: DrugCandidate[];
}

export enum ViewMode {
  GRID = 'GRID',
  CHART = 'CHART',
}

export type Language = 'en' | 'te';