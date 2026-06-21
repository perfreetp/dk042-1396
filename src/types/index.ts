export type UserRole = 'material_clerk' | 'apprentice' | 'intern';

export interface Task {
  id: string;
  title: string;
  description: string;
  aircraft: string;
  partName: string;
  partNumber: string;
  serialNumber: string;
  difficulty: 'easy' | 'medium' | 'hard';
  roles: UserRole[];
  requireAirworthinessTag: boolean;
  requireDisassemblyRecord: boolean;
  requireWorkCardNumber: boolean;
  roleFocus: Record<UserRole, string>;
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
  field: string;
  userAction: string;
  correctAction: string;
  riskNote: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  mastered: boolean;
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

export interface RetryConfig {
  resultId: string;
  step: 'borrow' | 'return';
  field: string;
}

export const EMPTY_BORROW: BorrowFormData = {
  partNumber: '',
  serialNumber: '',
  airworthinessTag: false,
  disassemblyRecord: false,
  workCardNumber: ''
};

export const EMPTY_RETURN: ReturnFormData = {
  partStatus: 'unknown',
  hasRepairTag: false,
  accessoriesComplete: false,
  remarks: ''
};

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  material_clerk: {
    label: '航材员',
    description: '重点练习件号序号核实、适航标签管理'
  },
  apprentice: {
    label: '维修学徒',
    description: '重点练习拆装记录核实、工卡号填写'
  },
  intern: {
    label: '实习生',
    description: '全面练习借还流程各项基本操作'
  }
};
