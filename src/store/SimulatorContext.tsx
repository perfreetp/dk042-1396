import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import {
  Task, BorrowFormData, ReturnFormData, SimulatorStep,
  ScoreItem, SimulationResult, FormFeedback, RetryConfig,
  EMPTY_BORROW, EMPTY_RETURN, UserRole, PracticeMode,
  CustomExam, ExamResult, ErrorCategoryKey, ERROR_CATEGORY_CONFIG, fieldToCategory
} from '@/types';

const STORAGE_KEY = 'avm_results';
const ROLE_KEY = 'avm_role';
const MODE_KEY = 'avm_mode';
const EXAM_KEY = 'avm_custom_exams';
const EXAMRESULT_KEY = 'avm_exam_results';
const EXPAND_KEY = 'avm_expand_result';

const loadResults = (): SimulationResult[] => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw as string);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { console.error('[Storage] loadResults fail', e); }
  return [];
};
const saveResults = (d: SimulationResult[]) => {
  try { Taro.setStorageSync(STORAGE_KEY, JSON.stringify(d)); } catch (e) { console.error('[Storage] save fail', e); }
};
const loadRole = (): UserRole => {
  try {
    const r = Taro.getStorageSync(ROLE_KEY);
    if (r === 'material_clerk' || r === 'apprentice' || r === 'intern') return r;
  } catch (e) { console.error('[Storage] loadRole fail', e); }
  return 'intern';
};
const loadMode = (): PracticeMode => {
  try {
    const m = Taro.getStorageSync(MODE_KEY);
    if (m === 'practice' || m === 'exam') return m;
  } catch (e) { /* noop */ }
  return 'practice';
};
const loadExams = (): CustomExam[] => {
  try {
    const raw = Taro.getStorageSync(EXAM_KEY);
    if (raw) { const p = JSON.parse(raw as string); if (Array.isArray(p)) return p; }
  } catch (e) { /* noop */ }
  return [];
};
const saveExams = (d: CustomExam[]) => {
  try { Taro.setStorageSync(EXAM_KEY, JSON.stringify(d)); } catch (e) { /* noop */ }
};
const loadExamResults = (): ExamResult[] => {
  try {
    const raw = Taro.getStorageSync(EXAMRESULT_KEY);
    if (raw) { const p = JSON.parse(raw as string); if (Array.isArray(p)) return p; }
  } catch (e) { /* noop */ }
  return [];
};
const saveExamResults = (d: ExamResult[]) => {
  try { Taro.setStorageSync(EXAMRESULT_KEY, JSON.stringify(d)); } catch (e) { /* noop */ }
};

interface SimulatorContextType {
  // state
  currentTask: Task | null;
  currentStep: SimulatorStep;
  borrowData: BorrowFormData;
  returnData: ReturnFormData;
  borrowFeedbacks: FormFeedback[];
  returnFeedbacks: FormFeedback[];
  currentResult: SimulationResult | null;
  results: SimulationResult[];
  retryConfig: RetryConfig | null;
  currentRole: UserRole;
  practiceMode: PracticeMode;
  customExams: CustomExam[];
  examResults: ExamResult[];
  activeExamId: string | null;
  activeExamIndex: number;
  activeExamResults: SimulationResult[];
  expandedResultId: string | null;
  // methods
  setCurrentTask: (task: Task | null) => void;
  setCurrentStep: (step: SimulatorStep) => void;
  setBorrowData: (data: Partial<BorrowFormData>) => void;
  setReturnData: (data: Partial<ReturnFormData>) => void;
  validateBorrowForm: (blocking?: boolean) => boolean;
  validateReturnForm: (blocking?: boolean) => boolean;
  calculateScore: () => SimulationResult | null;
  resetSimulation: () => void;
  addResult: (result: SimulationResult) => void;
  updateResultItem: (resultId: string, item: ScoreItem) => void;
  startRetry: (config: RetryConfig, task: Task) => void;
  clearRetry: () => void;
  setCurrentRole: (role: UserRole) => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setExpandedResultId: (id: string | null) => void;
  setActiveExamIndex: (idx: number) => void;
  createCustomExam: (args: { title: string; role: UserRole; taskIds: string[] }) => CustomExam;
  deleteCustomExam: (id: string) => void;
  startCustomExam: (examId: string) => boolean;
  saveCurrentExamResult: (taskResult: SimulationResult) => boolean;
  finishCustomExam: () => ExamResult | null;
  cancelCustomExam: () => void;
  startCategoryPractice: (catKey: ErrorCategoryKey, role?: UserRole) => Task | null;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);
export const useSimulator = () => {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider');
  return ctx;
};

interface P { children: ReactNode; }

export const SimulatorProvider: React.FC<P> = ({ children }) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentStep, setCurrentStep] = useState<SimulatorStep>('borrow');
  const [borrowData, setBorrowDataState] = useState<BorrowFormData>({ ...EMPTY_BORROW });
  const [returnData, setReturnDataState] = useState<ReturnFormData>({ ...EMPTY_RETURN });
  const [borrowFeedbacks, setBorrowFeedbacks] = useState<FormFeedback[]>([]);
  const [returnFeedbacks, setReturnFeedbacks] = useState<FormFeedback[]>([]);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [results, setResults] = useState<SimulationResult[]>(() => loadResults());
  const [retryConfig, setRetryConfig] = useState<RetryConfig | null>(null);
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => loadRole());
  const [practiceMode, setPracticeModeState] = useState<PracticeMode>(() => loadMode());
  const [customExams, setCustomExams] = useState<CustomExam[]>(() => loadExams());
  const [examResults, setExamResults] = useState<ExamResult[]>(() => loadExamResults());
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeExamIndex, setActiveExamIndex] = useState<number>(0);
  const [activeExamResults, setActiveExamResults] = useState<SimulationResult[]>([]);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(() => {
    try { return (Taro.getStorageSync(EXPAND_KEY) as string) || null; } catch { return null; }
  });

  const setBorrowData = useCallback((d: Partial<BorrowFormData>) => {
    setBorrowDataState(p => ({ ...p, ...d }));
  }, []);
  const setReturnData = useCallback((d: Partial<ReturnFormData>) => {
    setReturnDataState(p => ({ ...p, ...d }));
  }, []);
  const setCurrentRole = useCallback((r: UserRole) => {
    setCurrentRoleState(r);
    try { Taro.setStorageSync(ROLE_KEY, r); } catch (e) { /* noop */ }
  }, []);
  const setPracticeMode = useCallback((m: PracticeMode) => {
    setPracticeModeState(m);
    try { Taro.setStorageSync(MODE_KEY, m); } catch (e) { /* noop */ }
  }, []);
  const setExpandedResultId = useCallback((id: string | null) => {
    setExpandedResultId(id);
    try { if (id) Taro.setStorageSync(EXPAND_KEY, id); else Taro.removeStorageSync(EXPAND_KEY); } catch { /* noop */ }
  }, []);

  const validateBorrowForm = useCallback((blocking = true): boolean => {
    const fbs: FormFeedback[] = [];
    let ok = true;
    if (!borrowData.partNumber.trim()) { fbs.push({ field: 'partNumber', message: '请填写件号，件号是识别周转件的基础信息', type: 'error' }); ok = false; }
    if (!borrowData.serialNumber.trim()) { fbs.push({ field: 'serialNumber', message: '只填件号无法锁定实物，请补录序号', type: 'error' }); ok = false; }
    else if (currentTask && borrowData.serialNumber.trim() !== currentTask.serialNumber) { fbs.push({ field: 'serialNumber', message: '序号与任务信息不符，请核对后重新输入', type: 'error' }); ok = false; }
    if (currentTask?.requireAirworthinessTag && !borrowData.airworthinessTag) { fbs.push({ field: 'airworthinessTag', message: '该部件为关键周转件，必须确认适航标签', type: 'error' }); ok = false; }
    else if (!currentTask?.requireAirworthinessTag && borrowData.airworthinessTag) { fbs.push({ field: 'airworthinessTag', message: '提示：该部件无需适航标签，您已额外确认', type: 'warning' }); }
    if (currentTask?.requireDisassemblyRecord && !borrowData.disassemblyRecord) { fbs.push({ field: 'disassemblyRecord', message: '该部件需要检查拆装记录，请确认', type: 'error' }); ok = false; }
    if (currentTask?.requireWorkCardNumber && !borrowData.workCardNumber.trim()) { fbs.push({ field: 'workCardNumber', message: '请填写工卡号，便于后续追溯维修记录', type: 'error' }); ok = false; }
    if (ok && fbs.length === 0) fbs.push({ field: 'all', message: '借出信息填写完整，可以进入归还环节', type: 'success' });
    setBorrowFeedbacks(fbs);
    console.log('[ValidateBorrow]', { ok, blocking, fbs });
    return blocking ? ok : true;
  }, [borrowData, currentTask]);

  const validateReturnForm = useCallback((blocking = true): boolean => {
    const fbs: FormFeedback[] = [];
    let ok = true;
    if (returnData.partStatus === 'unknown') { fbs.push({ field: 'partStatus', message: '请明确选择拆下件状态（良好/损坏），便于后续维修安排', type: 'error' }); ok = false; }
    if (returnData.partStatus === 'damaged' && !returnData.hasRepairTag) { fbs.push({ field: 'hasRepairTag', message: '损坏部件必须挂待修牌，防止误用', type: 'error' }); ok = false; }
    if (returnData.partStatus === 'good' && returnData.hasRepairTag) { fbs.push({ field: 'hasRepairTag', message: '提示：良好状态部件无需挂待修牌', type: 'warning' }); }
    if (!returnData.accessoriesComplete) { fbs.push({ field: 'accessoriesComplete', message: '请确认附件是否齐套，缺失附件需在备注中说明', type: 'error' }); ok = false; }
    if (ok && fbs.length === 0) fbs.push({ field: 'all', message: '归还信息填写完整，可以查看评分结果', type: 'success' });
    setReturnFeedbacks(fbs);
    console.log('[ValidateReturn]', { ok, blocking, fbs });
    return blocking ? ok : true;
  }, [returnData]);

  const calculateScore = useCallback((): SimulationResult | null => {
    if (!currentTask) return null;
    const borrowScore: ScoreItem[] = [];
    borrowScore.push({
      step: '件号填写', field: 'partNumber',
      userAction: borrowData.partNumber ? `填写件号：${borrowData.partNumber}` : '未填写件号',
      correctAction: `填写件号：${currentTask.partNumber}`,
      riskNote: borrowData.partNumber.trim() !== currentTask.partNumber ? '件号填写错误或遗漏将导致错误部件装机，可能引发系统故障甚至飞行事故' : '',
      score: borrowData.partNumber.trim() === currentTask.partNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.partNumber.trim() === currentTask.partNumber,
      mastered: borrowData.partNumber.trim() === currentTask.partNumber,
    });
    borrowScore.push({
      step: '序号填写', field: 'serialNumber',
      userAction: borrowData.serialNumber ? `填写序号：${borrowData.serialNumber}` : '未填写序号',
      correctAction: `填写序号：${currentTask.serialNumber}`,
      riskNote: borrowData.serialNumber.trim() !== currentTask.serialNumber ? '漏填序号导致实物无法唯一锁定，一旦混件将无法追溯源头，存在严重适航隐患' : '',
      score: borrowData.serialNumber.trim() === currentTask.serialNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.serialNumber.trim() === currentTask.serialNumber,
      mastered: borrowData.serialNumber.trim() === currentTask.serialNumber,
    });
    if (currentTask.requireAirworthinessTag) borrowScore.push({
      step: '适航标签确认', field: 'airworthinessTag',
      userAction: borrowData.airworthinessTag ? '已确认适航标签' : '未确认适航标签',
      correctAction: '必须确认适航标签',
      riskNote: !borrowData.airworthinessTag ? '未确认适航标签可能导致不合格件装机，危及飞行安全，属于严重适航违规' : '',
      score: borrowData.airworthinessTag ? 10 : 0, maxScore: 10,
      isCorrect: borrowData.airworthinessTag, mastered: borrowData.airworthinessTag,
    });
    if (currentTask.requireDisassemblyRecord) borrowScore.push({
      step: '拆装记录确认', field: 'disassemblyRecord',
      userAction: borrowData.disassemblyRecord ? '已确认拆装记录' : '未确认拆装记录',
      correctAction: '必须确认拆装记录',
      riskNote: !borrowData.disassemblyRecord ? '未确认拆装记录将导致部件历史无法追溯，可能遗漏潜在故障隐患' : '',
      score: borrowData.disassemblyRecord ? 10 : 0, maxScore: 10,
      isCorrect: borrowData.disassemblyRecord, mastered: borrowData.disassemblyRecord,
    });
    if (currentTask.requireWorkCardNumber) borrowScore.push({
      step: '工卡号填写', field: 'workCardNumber',
      userAction: borrowData.workCardNumber ? `填写工卡号：${borrowData.workCardNumber}` : '未填写工卡号',
      correctAction: '必须填写工卡号',
      riskNote: !borrowData.workCardNumber.trim() ? '未填写工卡号将导致维修记录无法追溯，一旦发生故障无法定位责任人' : '',
      score: borrowData.workCardNumber.trim() ? 10 : 0, maxScore: 10,
      isCorrect: !!borrowData.workCardNumber.trim(), mastered: !!borrowData.workCardNumber.trim(),
    });
    const returnScore: ScoreItem[] = [];
    const psOk = returnData.partStatus !== 'unknown';
    returnScore.push({
      step: '拆下件状态选择', field: 'partStatus',
      userAction: `选择状态：${returnData.partStatus === 'good' ? '良好' : returnData.partStatus === 'damaged' ? '损坏' : '未知'}`,
      correctAction: '应明确标注故障状态',
      riskNote: !psOk ? '状态不明导致部件后续无法正确处置，可能将故障件误判为可用件装机' : '',
      score: psOk ? 10 : 5, maxScore: 10, isCorrect: psOk, mastered: psOk,
    });
    const rtOk = (returnData.partStatus === 'damaged' && returnData.hasRepairTag) || (returnData.partStatus !== 'damaged' && !returnData.hasRepairTag);
    returnScore.push({
      step: '待修牌确认', field: 'hasRepairTag',
      userAction: returnData.hasRepairTag ? '已挂待修牌' : '未挂待修牌',
      correctAction: returnData.partStatus === 'damaged' ? '故障件必须挂待修牌' : '良好状态无需挂待修牌',
      riskNote: !rtOk && returnData.partStatus === 'damaged' ? '未挂待修牌导致故障件可能被误当可用件发出，造成重复故障甚至空中停车' : '',
      score: rtOk ? 10 : 0, maxScore: 10, isCorrect: rtOk, mastered: rtOk,
    });
    returnScore.push({
      step: '附件齐套检查', field: 'accessoriesComplete',
      userAction: returnData.accessoriesComplete ? '确认附件齐套' : '附件不齐套',
      correctAction: '确认附件齐套',
      riskNote: !returnData.accessoriesComplete ? '附件不齐套将导致安装时缺件，可能引发密封失效或连接松动' : '',
      score: returnData.accessoriesComplete ? 10 : 0, maxScore: 10,
      isCorrect: returnData.accessoriesComplete, mastered: returnData.accessoriesComplete,
    });
    const totalScore = [...borrowScore, ...returnScore].reduce((s, i) => s + i.score, 0);
    const maxScore = [...borrowScore, ...returnScore].reduce((s, i) => s + i.maxScore, 0);
    const result: SimulationResult = {
      id: `result-${Date.now()}`,
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      aircraft: currentTask.aircraft,
      borrowScore, returnScore, totalScore, maxScore,
      completedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      mode: practiceMode,
      examId: activeExamId || undefined,
    };
    setCurrentResult(result);
    console.log('[CalculateScore]', { result, mode: practiceMode, examId: activeExamId });
    return result;
  }, [currentTask, borrowData, returnData, practiceMode, activeExamId]);

  const resetSimulation = useCallback(() => {
    setCurrentTask(null);
    setCurrentStep('borrow');
    setBorrowDataState({ ...EMPTY_BORROW });
    setReturnDataState({ ...EMPTY_RETURN });
    setBorrowFeedbacks([]);
    setReturnFeedbacks([]);
    setCurrentResult(null);
    setRetryConfig(null);
    console.log('[SimulationReset]');
  }, []);

  const addResult = useCallback((r: SimulationResult) => {
    setResults(prev => {
      const next = [r, ...prev];
      saveResults(next);
      return next;
    });
    console.log('[ResultAdded]', { id: r.id });
  }, []);

  const updateResultItem = useCallback((resultId: string, upd: ScoreItem) => {
    setResults(prev => {
      const next = prev.map(r => {
        if (r.id !== resultId) return r;
        const mapper = (it: ScoreItem): ScoreItem => it.field === upd.field ? { ...upd } : it;
        return {
          ...r,
          borrowScore: r.borrowScore.map(mapper),
          returnScore: r.returnScore.map(mapper),
          totalScore: [...r.borrowScore.map(mapper), ...r.returnScore.map(mapper)].reduce((s, i) => s + i.score, 0),
        };
      });
      saveResults(next);
      return next;
    });
    console.log('[ResultItemUpdated]', { resultId, field: upd.field, mastered: upd.mastered });
  }, []);

  const startRetry = useCallback((config: RetryConfig, task: Task) => {
    setCurrentTask(task);
    setBorrowDataState({ ...EMPTY_BORROW });
    setReturnDataState({ ...EMPTY_RETURN });
    setBorrowFeedbacks([]);
    setReturnFeedbacks([]);
    setCurrentResult(null);
    setRetryConfig(config);
    setCurrentStep(config.step);
    setExpandedResultId(config.resultId);
    console.log('[StartRetry]', config);
  }, [setExpandedResultId]);

  const clearRetry = useCallback(() => { setRetryConfig(null); }, []);

  // ===== Custom Exams =====
  const setActiveExamIndex = useCallback((idx: number) => {
    setActiveExamIndex(idx);
  }, []);

  const createCustomExam = useCallback((args: { title: string; role: UserRole; taskIds: string[] }): CustomExam => {
    const { title, role, taskIds } = args;
    const exam: CustomExam = {
      id: `exam-${Date.now()}`,
      title,
      role,
      taskIds,
      createdAt: new Date().toLocaleString('zh-CN'),
      createdBy: 'teacher',
    };
    setCustomExams(prev => { const next = [exam, ...prev]; saveExams(next); return next; });
    console.log('[CreateExam]', { id: exam.id, title, role, count: taskIds.length });
    return exam;
  }, []);

  const deleteCustomExam = useCallback((id: string) => {
    setCustomExams(prev => { const next = prev.filter(e => e.id !== id); saveExams(next); return next; });
  }, []);

  const startCustomExam = useCallback((examId: string): boolean => {
    const exam = customExams.find(e => e.id === examId);
    if (!exam || exam.taskIds.length === 0) return false;
    // eslint-disable-next-line
    const { mockTasks } = require('@/data/mockTasks');
    const firstTask = mockTasks.find((t: Task) => t.id === exam.taskIds[0]);
    if (!firstTask) return false;
    // force exam mode
    if (exam.role && exam.role !== currentRole) {
      setCurrentRoleState(exam.role);
      try { Taro.setStorageSync(ROLE_KEY, exam.role); } catch { /* noop */ }
    }
    setPracticeModeState('exam');
    try { Taro.setStorageSync(MODE_KEY, 'exam'); } catch { /* noop */ }
    resetSimulation();
    setActiveExamId(examId);
    setActiveExamIndex(0);
    setActiveExamResults([]);
    setCurrentTask(firstTask);
    setCurrentStep('borrow');
    console.log('[StartExam]', { examId, tasks: exam.taskIds.length, firstTask: firstTask.id });
    return true;
  }, [customExams, currentRole, resetSimulation]);

  const saveCurrentExamResult = useCallback((taskResult: SimulationResult): boolean => {
    if (!activeExamId) return false;
    // save into global result list
    setResults(prev => { const next = [taskResult, ...prev]; saveResults(next); return next; });
    setActiveExamResults(prev => [...prev, taskResult]);
    return true;
  }, [activeExamId]);

  const finishCustomExam = useCallback((): ExamResult | null => {
    if (!activeExamId) return null;
    const exam = customExams.find(e => e.id === activeExamId);
    if (!exam) return null;
    const totalScore = activeExamResults.reduce((s, r) => s + r.totalScore, 0);
    const maxScore = activeExamResults.reduce((s, r) => s + r.maxScore, 0);
    const rate = maxScore > 0 ? totalScore / maxScore : 0;
    let comment = '';
    if (rate >= 0.9) comment = '整套试卷表现优秀，操作规范到位，建议继续保持！';
    else if (rate >= 0.75) comment = '整体表现良好，个别项需加强练习，建议针对性回顾错题。';
    else if (rate >= 0.6) comment = '已达到及格线，借还流程还有疏漏，需要反复操练。';
    else comment = '本次练习未达合格标准，建议重新学习操作规范后再次刷题。';
    const er: ExamResult = {
      examId: activeExamId,
      examTitle: exam.title,
      taskResults: activeExamResults,
      totalScore, maxScore,
      completedAt: new Date().toLocaleString('zh-CN'),
      comment,
    };
    setExamResults(prev => { const next = [er, ...prev]; saveExamResults(next); return next; });
    setActiveExamId(null);
    setActiveExamIndex(0);
    setActiveExamResults([]);
    console.log('[FinishExam]', { examId: activeExamId, totalScore, maxScore, comment });
    return er;
  }, [activeExamId, customExams, activeExamResults]);

  const cancelCustomExam = useCallback(() => {
    setActiveExamId(null);
    setActiveExamIndex(0);
    setActiveExamResults([]);
  }, []);

  // ===== Category Practice (from wrongbook) =====
  const startCategoryPractice = useCallback((catKey: ErrorCategoryKey, role?: UserRole): Task | null => {
    // eslint-disable-next-line
    const { mockTasks } = require('@/data/mockTasks');
    const cfg = ERROR_CATEGORY_CONFIG[catKey];
    if (!cfg) return null;
    const effectiveRole = role || currentRole;
    const candidates = mockTasks.filter((t: Task) => {
      if (!t.roles.includes(effectiveRole)) return false;
      if (cfg.fields.includes('airworthinessTag') && !t.requireAirworthinessTag) return false;
      if (cfg.fields.includes('disassemblyRecord') && !t.requireDisassemblyRecord) return false;
      if (cfg.fields.includes('workCardNumber') && !t.requireWorkCardNumber) return false;
      return true;
    });
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (role && role !== currentRole) {
      setCurrentRoleState(role);
      try { Taro.setStorageSync(ROLE_KEY, role); } catch { /* noop */ }
    }
    resetSimulation();
    setCurrentTask(pick);
    setCurrentStep(cfg.borrow ? 'borrow' : 'return');
    console.log('[StartCategoryPractice]', { cat: catKey, taskId: pick.id, role: effectiveRole });
    return pick;
  }, [currentRole, resetSimulation]);

  return (
    <SimulatorContext.Provider
      value={{
        currentTask, currentStep, borrowData, returnData,
        borrowFeedbacks, returnFeedbacks, currentResult, results,
        retryConfig, currentRole, practiceMode,
        customExams, examResults,
        activeExamId, activeExamIndex, activeExamResults,
        expandedResultId,
        setCurrentTask, setCurrentStep, setBorrowData, setReturnData,
        validateBorrowForm, validateReturnForm, calculateScore,
        resetSimulation, addResult, updateResultItem,
        startRetry, clearRetry,
        setCurrentRole, setPracticeMode, setExpandedResultId,
        setActiveExamIndex,
        createCustomExam, deleteCustomExam,
        startCustomExam, saveCurrentExamResult, finishCustomExam, cancelCustomExam,
        startCategoryPractice,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};
