// Types TypeScript pour le module Periodontal Chart
// Système FDI (ISO 3950) — Europe / Algérie

export type ToothNumber =
  | 11|12|13|14|15|16|17|18
  | 21|22|23|24|25|26|27|28
  | 31|32|33|34|35|36|37|38
  | 41|42|43|44|45|46|47|48;

export type FurcationGrade = 0 | 1 | 2 | 3;
export type MobilityGrade = 0 | 1 | 2 | 3;
export type SitePosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface PerioSite {
  site_position: SitePosition;
  PD: number;   // Probing Depth ≥ 0
  GM: number;   // Gingival Margin (peut être négatif)
  BOP: boolean; // Bleeding on Probing
  PI: boolean;  // Plaque Index
  CAL?: number; // Calculé dynamiquement : PD - GM
}

export interface PerioTooth {
  tooth_number: ToothNumber;
  mobility: MobilityGrade;
  furcation: FurcationGrade;
  sites: PerioSite[]; // exactement 6 sites
}

export interface PerioChart {
  id?: number;
  patient_id: number;
  doctor_id: number;
  exam_date: string;
  status: 'draft' | 'finalized';
  notes?: string;
  teeth: PerioTooth[];
}

// Données mock pour les tests (1 dent exemple)
export const MOCK_SITES: PerioSite[] = [
  { site_position: 1, PD: 3, GM: 0, BOP: false, PI: false },
  { site_position: 2, PD: 2, GM: 0, BOP: false, PI: true  },
  { site_position: 3, PD: 4, GM: 1, BOP: true,  PI: false },
  { site_position: 4, PD: 3, GM: 0, BOP: false, PI: false },
  { site_position: 5, PD: 5, GM: 2, BOP: true,  PI: true  },
  { site_position: 6, PD: 2, GM: 0, BOP: false, PI: false },
];

export const MOCK_TOOTH: PerioTooth = {
  tooth_number: 11,
  mobility: 0,
  furcation: 0,
  sites: MOCK_SITES,
};