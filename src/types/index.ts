export interface Task {
  id: string;
  title: string;
  description: string;
  aircraft: string;
  partName: string;
  partNumber: string;
  serialNumber: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requireAirworthinessTag: boolean;
  requireDisassemblyRecord: boolean;
  requireWorkCardNumber: boolean;
}

export interface BorrowFormData {
  partNumber: string;
  serialNumber: string;
  airworthinessTag: boolean;
  disassemblyRecord: boolean;
  workCardNumber: string;
}

export interface ReturnFormData {
  partStatus: 'good' | 'damaged' | 'unknown';
  hasRepairTag: boolean;
  accessoriesComplete: boolean;
  remarks: string;
}

export interface FormFeedback {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'success';
}

export interface ScoreItem {
  step: string;
  userAction: string;
  correctAction: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
}

export interface SimulationResult {
  id: string;
  taskId: string;
  taskTitle: string;
  aircraft: string;
  borrowScore: ScoreItem[];
  returnScore: ScoreItem[];
  totalScore: number;
  maxScore: number;
  completedAt: string;
}

export type SimulatorStep = 'borrow' | 'return' | 'result';
