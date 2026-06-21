export type UserRole = 'material_clerk' | 'apprentice' | 'intern';

export type PracticeMode = 'practice' | 'exam';

export type ErrorCategoryKey =
  | 'serial'
  | 'tag'
  | 'workcard'
  | 'disassembly'
  | 'repair'
  | 'status'
  | 'accessory'
  | 'partnumber';

export const ERROR_CATEGORY_CONFIG: Record<ErrorCategoryKey, {
  label: string;
  fields: string[];
  borrow: boolean;
  description: string;
}> = {
  partnumber: {
    label: '件号类',
    fields: ['partNumber'],
    borrow: true,
    description: '件号填写错误或遗漏'
  },
  serial: {
    label: '序号类',
    fields: ['serialNumber'],
    borrow: true,
    description: '序号未填写或填写错误'
  },
  tag: {
    label: '标签类',
    fields: ['airworthinessTag'],
    borrow: true,
    description: '适航标签确认遗漏'
  },
  disassembly: {
    label: '拆装记录类',
    fields: ['disassemblyRecord'],
    borrow: true,
    description: '拆装记录确认遗漏'
  },
  workcard: {
    label: '工卡类',
    fields: ['workCardNumber'],
    borrow: true,
    description: '工卡号未填写或错误'
  },
  status: {
    label: '状态判断类',
    fields: ['partStatus'],
    borrow: false,
    description: '拆下件状态未正确标注'
  },
  repair: {
    label: '待修牌类',
    fields: ['hasRepairTag'],
    borrow: false,
    description: '待修牌未按规定悬挂'
  },
  accessory: {
    label: '附件齐套类',
    fields: ['accessoriesComplete'],
    borrow: false,
    description: '附件齐套情况未确认'
  }
};

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
  mode: PracticeMode;
  examId?: string;
}

export type SimulatorStep = 'borrow' | 'return' | 'result';

export interface RetryConfig {
  resultId: string;
  step: 'borrow' | 'return';
  field: string;
}

export interface CustomExam {
  id: string;
  title: string;
  role: UserRole;
  taskIds: string[];
  createdAt: string;
  createdBy: 'teacher' | 'custom' | 'draft' | 'copy';
  updatedAt?: string;
  sourceId?: string;
}

export interface ExamResult {
  examId: string;
  examTitle: string;
  taskResults: SimulationResult[];
  totalScore: number;
  maxScore: number;
  completedAt: string;
  comment: string;
}

export interface TeacherReviewItem {
  id: string;
  category: ErrorCategoryKey;
  categoryLabel: string;
  taskId: string;
  taskTitle: string;
  resultId: string;
  field: string;
  step: string;
  userAction: string;
  correctAction: string;
  riskNote: string;
  mastered: boolean;
  completedAt: string;
  score: number;
  maxScore: number;
}

export interface TeacherReviewSummary {
  totalCount: number;
  pendingCount: number;
  masteredCount: number;
  byCategory: Record<ErrorCategoryKey, { total: number; pending: number; mastered: number; masteryRate: number }>;
  byRole: Record<UserRole, { total: number; pending: number; masteryRate: number }>;
  byTask: Record<string, { title: string; total: number; pending: number; masteryRate: number }>;
  recentItems: TeacherReviewItem[];
  topRiskItems: TeacherReviewItem[];
}

export interface DailyCategoryStat {
  date: string;
  masteryRate: number;
  total: number;
  mastered: number;
  errors: number;
}

export interface CategoryTrend {
  category: ErrorCategoryKey;
  label: string;
  icon: string;
  currentRate: number;
  weekAgoRate: number;
  delta: number;
  dailyStats: DailyCategoryStat[];
  total: number;
  mastered: number;
  pending: number;
}

export interface WeeklyDashboard {
  startDate: string;
  endDate: string;
  totalPractices: number;
  totalItems: number;
  overallMasteryRate: number;
  weekAgoMasteryRate: number;
  categoryTrends: CategoryTrend[];
  hotCategories: ErrorCategoryKey[];
  improvingCategories: ErrorCategoryKey[];
}

export interface ContinuousPracticeConfig {
  category: ErrorCategoryKey;
  totalTasks: number;
  currentIndex: number;
  taskIds: string[];
}

export type ResultsViewMode = 'history' | 'review' | 'dashboard';

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

export const fieldToCategory = (field: string): ErrorCategoryKey => {
  const entries = Object.entries(ERROR_CATEGORY_CONFIG) as [ErrorCategoryKey, typeof ERROR_CATEGORY_CONFIG[ErrorCategoryKey]][];
  const found = entries.find(([, cfg]) => cfg.fields.includes(field));
  return found ? found[0] : 'partnumber';
};
