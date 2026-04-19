export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  commune: string;
  economicActivity: string;
  numWorkers: number;
  responsible: string;
  userId?: string;
}

export interface SexGenderIdentity {
  id: string;
  label: string;
  count: number;
}

export interface ProcessDocument {
  id: string;
  companyId: string;
  process: string;
  processDescription: string;
  jobPositionsInvolved: string;
  taskName: string;
  taskDescription: string;
  isRoutine: boolean;
  specificLocation: string;
  numberOfWorkers: number;
  sexGenderIdentities: string;
  observations?: string;
  frequency?: string;
  duration?: string;
  tools?: string;
  materials?: string;
  environmentalConditions?: string;
  requiredTraining?: string;
  userId?: string;
}

export interface RiskEvaluation {
  riskLevel: string;
}

export interface PsychosocialRiskEvaluation {
  riskLevel: string;
  dimension?: string;
  justification?: string;
}

export const CONTROL_CLASSIFICATIONS = [
  'Eliminación',
  'Sustitución',
  'Control de Ingeniería',
  'Control Administrativo',
  'EPP',
] as const;

export type ControlClassification = typeof CONTROL_CLASSIFICATIONS[number];

export const ACTION_TYPES = [
  'Compra',
  'Instalación',
  'Capacitación',
  'Procedimiento',
  'Mantención',
  'Evaluación',
] as const;

export type ActionType = typeof ACTION_TYPES[number];

export interface ActionPlanItem {
  measureId: string;
  responsible: string;
  responsibleRole: string;
  startDate: string;
  endDate: string;
  budget?: number;
  status: 'No iniciado' | 'En planificación' | 'En ejecución' | 'Completado';
  progress: number;
  verificationMethod: string;
  verificationDate: string;
  verificationResponsible: string;
  verificationResult?: string;
  evidenceFiles?: string[];
  observations?: string;
  difficulties?: string;
  rescheduled?: boolean;
  rescheduledDate?: string;
}

export interface SpecificAction {
  id: string;
  description: string;
  type: ActionType | string;
  responsible: string;
  estimatedCost?: number;
  startDate: string;
  endDate: string;
  status: 'No iniciado' | 'En planificación' | 'En progreso' | 'Completado';
  notes?: string;
}

export interface ControlMeasure {
  id: string;
  description: string;
  classification: ControlClassification | string;
  responsible: string;
  startDate: string;
  endDate: string;
  status: 'Pendiente' | 'En progreso' | 'Completado';
  specificActions?: SpecificAction[];
  actionPlan?: ActionPlanItem;
}

export interface RiskAnalysis {
  id: string;
  processId: string;
  process: string;
  processDescription: string;
  taskName: string;
  taskDescription: string;
  jobPositionsInvolved: string;
  sexGenderIdentities: string;
  specificLocation: string;
  numberOfWorkers: number;
  hazard: string;
  risk: string;
  security: {
    probability: string;
    consequence: string;
    vep: string;
    riskLevel: string;
    measures?: ControlMeasure[];
  };
  hygienic: RiskEvaluation & { measures?: ControlMeasure[] };
  psychosocial: PsychosocialRiskEvaluation & { measures?: ControlMeasure[] };
  musculoskeletal: RiskEvaluation & { measures?: ControlMeasure[] };
  preventiveMeasures: ControlMeasure[];
  riskCoordinates?: { x: number; y: number };
  userId?: string;
  companyId?: string;
}

export interface GanttActivity {
  id: string;
  riskId: string;
  risk: string;
  measure: string;
  classification: ControlClassification | string;
  riskLevel?: string;
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  responsible: string;
  startDate: string;
  endDate: string;
  status: 'Pendiente' | 'En progreso' | 'Completado';
  userId?: string;
  companyId?: string;
}

export interface SavedMatrix {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  savedAt: string;
  riskAnalyses: RiskAnalysis[];
  ganttActivities: GanttActivity[];
  userId?: string;
}

export type AcquisitionStatus = 'Draft' | 'Requested' | 'Approved' | 'Ordered' | 'Received' | 'Cancelled';

export interface PurchaseLine {
  id: string;
  companyId?: string;
  originRiskId?: string;
  originMeasureId?: string;
  article: string;
  classification: ControlClassification | string;
  quantityRequested: number;
  quantityApproved?: number;
  unitCost?: number;
  totalCost?: number;
  supplier?: string;
  requestedBy?: string;
  status: AcquisitionStatus;
  requiredBy?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  userId?: string;
}
