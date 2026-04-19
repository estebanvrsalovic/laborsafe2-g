export interface Company {
  id: string;
  userId: string;
  name: string;
  rut: string;
  address: string;
  commune: string;
  economicActivity: string;
  numWorkers: number;
  responsibleName: string;
  responsibleRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessDocument {
  id: string;
  companyId: string;
  userId: string;
  process: string;
  task: string;
  jobPositions: string[];
  numWorkers: number;
  frequency: string;
  duration: string;
  tools: string;
  materials: string;
  environmentalConditions: string;
  requiredTraining: string;
  createdAt: Date;
}

export type RiskLevel = 'Trivial' | 'Tolerable' | 'Moderado' | 'Importante' | 'Intolerable';
export type MeasureClassification =
  | 'Eliminación'
  | 'Sustitución'
  | 'Controles de Ingeniería'
  | 'Controles Administrativos'
  | 'EPP';

export interface PreventiveMeasure {
  id: string;
  description: string;
  classification: MeasureClassification;
  responsible?: string;
  dueDate?: string;
  status?: 'Pendiente' | 'En Progreso' | 'Completada';
}

export interface RiskAnalysis {
  id: string;
  companyId: string;
  processId: string;
  userId: string;
  hazard: string;
  risk: string;
  securityEvaluation: {
    probability: number;
    consequence: number;
    vep: number;
    riskLevel: RiskLevel;
  };
  hygienicRiskLevel: RiskLevel;
  psychosocialRiskLevel: RiskLevel;
  musculoskeletalRiskLevel: RiskLevel;
  preventiveMeasures: PreventiveMeasure[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GanttActivity {
  id: string;
  riskId: string;
  companyId: string;
  userId: string;
  measure: string;
  classification: MeasureClassification;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'En Progreso' | 'Completada';
  responsible: string;
  startDate: string;
  endDate: string;
  budget?: number;
}

export interface SavedMatrix {
  id: string;
  name: string;
  companyId: string;
  userId: string;
  savedAt: Date;
  riskAnalyses: RiskAnalysis[];
  ganttActivities: GanttActivity[];
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
