import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import {
  Task, BorrowFormData, ReturnFormData, SimulatorStep,
  ScoreItem, SimulationResult, FormFeedback, RetryConfig,
  EMPTY_BORROW, EMPTY_RETURN, UserRole
} from '@/types';

const STORAGE_KEY = 'avm_results';
const ROLE_KEY = 'avm_role';

const loadResults = (): SimulationResult[] => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw as string);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[Storage] Failed to load results:', e);
  }
  return [];
};

const saveResults = (data: SimulationResult[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] Failed to save results:', e);
  }
};

const loadRole = (): UserRole => {
  try {
    const r = Taro.getStorageSync(ROLE_KEY);
    if (r === 'material_clerk' || r === 'apprentice' || r === 'intern') return r;
  } catch (e) {
    console.error('[Storage] Failed to load role:', e);
  }
  return 'intern';
};

interface SimulatorContextType {
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
  setCurrentTask: (task: Task | null) => void;
  setCurrentStep: (step: SimulatorStep) => void;
  setBorrowData: (data: Partial<BorrowFormData>) => void;
  setReturnData: (data: Partial<ReturnFormData>) => void;
  validateBorrowForm: () => boolean;
  validateReturnForm: () => boolean;
  calculateScore: () => void;
  resetSimulation: () => void;
  addResult: (result: SimulationResult) => void;
  updateResultItem: (resultId: string, item: ScoreItem) => void;
  startRetry: (config: RetryConfig, task: Task) => void;
  clearRetry: () => void;
  setCurrentRole: (role: UserRole) => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) throw new Error('useSimulator must be used within SimulatorProvider');
  return context;
};

interface SimulatorProviderProps {
  children: ReactNode;
}

export const SimulatorProvider: React.FC<SimulatorProviderProps> = ({ children }) => {
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

  const setBorrowData = useCallback((data: Partial<BorrowFormData>) => {
    setBorrowDataState(prev => ({ ...prev, ...data }));
  }, []);

  const setReturnData = useCallback((data: Partial<ReturnFormData>) => {
    setReturnDataState(prev => ({ ...prev, ...data }));
  }, []);

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role);
    try { Taro.setStorageSync(ROLE_KEY, role); } catch (e) { console.error('[Storage] Role save failed:', e); }
    console.log('[RoleChanged]', role);
  }, []);

  const validateBorrowForm = useCallback((): boolean => {
    const feedbacks: FormFeedback[] = [];
    let isValid = true;

    if (!borrowData.partNumber.trim()) {
      feedbacks.push({ field: 'partNumber', message: '请填写件号，件号是识别周转件的基础信息', type: 'error' });
      isValid = false;
    }

    if (!borrowData.serialNumber.trim()) {
      feedbacks.push({ field: 'serialNumber', message: '只填件号无法锁定实物，请补录序号', type: 'error' });
      isValid = false;
    } else if (currentTask && borrowData.serialNumber.trim() !== currentTask.serialNumber) {
      feedbacks.push({ field: 'serialNumber', message: '序号与任务信息不符，请核对后重新输入', type: 'error' });
      isValid = false;
    }

    if (currentTask?.requireAirworthinessTag && !borrowData.airworthinessTag) {
      feedbacks.push({ field: 'airworthinessTag', message: '该部件为关键周转件，必须确认适航标签', type: 'error' });
      isValid = false;
    } else if (!currentTask?.requireAirworthinessTag && borrowData.airworthinessTag) {
      feedbacks.push({ field: 'airworthinessTag', message: '提示：该部件无需适航标签，您已额外确认', type: 'warning' });
    }

    if (currentTask?.requireDisassemblyRecord && !borrowData.disassemblyRecord) {
      feedbacks.push({ field: 'disassemblyRecord', message: '该部件需要检查拆装记录，请确认', type: 'error' });
      isValid = false;
    }

    if (currentTask?.requireWorkCardNumber && !borrowData.workCardNumber.trim()) {
      feedbacks.push({ field: 'workCardNumber', message: '请填写工卡号，便于后续追溯维修记录', type: 'error' });
      isValid = false;
    }

    if (isValid && feedbacks.length === 0) {
      feedbacks.push({ field: 'all', message: '借出信息填写完整，可以进入归还环节', type: 'success' });
    }

    setBorrowFeedbacks(feedbacks);
    console.log('[BorrowValidation]', { isValid, feedbacks });
    return isValid;
  }, [borrowData, currentTask]);

  const validateReturnForm = useCallback((): boolean => {
    const feedbacks: FormFeedback[] = [];
    let isValid = true;

    if (returnData.partStatus === 'unknown') {
      feedbacks.push({ field: 'partStatus', message: '请明确选择拆下件状态（良好/损坏），便于后续维修安排', type: 'error' });
      isValid = false;
    }

    if (returnData.partStatus === 'damaged' && !returnData.hasRepairTag) {
      feedbacks.push({ field: 'hasRepairTag', message: '损坏部件必须挂待修牌，防止误用', type: 'error' });
      isValid = false;
    }

    if (returnData.partStatus === 'good' && returnData.hasRepairTag) {
      feedbacks.push({ field: 'hasRepairTag', message: '提示：良好状态部件无需挂待修牌', type: 'warning' });
    }

    if (!returnData.accessoriesComplete) {
      feedbacks.push({ field: 'accessoriesComplete', message: '请确认附件是否齐套，缺失附件需在备注中说明', type: 'error' });
      isValid = false;
    }

    if (isValid && feedbacks.length === 0) {
      feedbacks.push({ field: 'all', message: '归还信息填写完整，可以查看评分结果', type: 'success' });
    }

    setReturnFeedbacks(feedbacks);
    console.log('[ReturnValidation]', { isValid, feedbacks });
    return isValid;
  }, [returnData]);

  const calculateScore = useCallback(() => {
    if (!currentTask) return;

    const borrowScore: ScoreItem[] = [];

    borrowScore.push({
      step: '件号填写', field: 'partNumber',
      userAction: borrowData.partNumber ? `填写件号：${borrowData.partNumber}` : '未填写件号',
      correctAction: `填写件号：${currentTask.partNumber}`,
      riskNote: borrowData.partNumber.trim() !== currentTask.partNumber
        ? '件号填写错误或遗漏将导致错误部件装机，可能引发系统故障甚至飞行事故'
        : '',
      score: borrowData.partNumber.trim() === currentTask.partNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.partNumber.trim() === currentTask.partNumber,
      mastered: borrowData.partNumber.trim() === currentTask.partNumber
    });

    borrowScore.push({
      step: '序号填写', field: 'serialNumber',
      userAction: borrowData.serialNumber ? `填写序号：${borrowData.serialNumber}` : '未填写序号',
      correctAction: `填写序号：${currentTask.serialNumber}`,
      riskNote: borrowData.serialNumber.trim() !== currentTask.serialNumber
        ? '漏填序号导致实物无法唯一锁定，一旦混件将无法追溯源头，存在严重适航隐患'
        : '',
      score: borrowData.serialNumber.trim() === currentTask.serialNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.serialNumber.trim() === currentTask.serialNumber,
      mastered: borrowData.serialNumber.trim() === currentTask.serialNumber
    });

    if (currentTask.requireAirworthinessTag) {
      borrowScore.push({
        step: '适航标签确认', field: 'airworthinessTag',
        userAction: borrowData.airworthinessTag ? '已确认适航标签' : '未确认适航标签',
        correctAction: '必须确认适航标签',
        riskNote: !borrowData.airworthinessTag
          ? '未确认适航标签可能导致不合格件装机，危及飞行安全，属于严重适航违规'
          : '',
        score: borrowData.airworthinessTag ? 10 : 0,
        maxScore: 10,
        isCorrect: borrowData.airworthinessTag,
        mastered: borrowData.airworthinessTag
      });
    }

    if (currentTask.requireDisassemblyRecord) {
      borrowScore.push({
        step: '拆装记录确认', field: 'disassemblyRecord',
        userAction: borrowData.disassemblyRecord ? '已确认拆装记录' : '未确认拆装记录',
        correctAction: '必须确认拆装记录',
        riskNote: !borrowData.disassemblyRecord
          ? '未确认拆装记录将导致部件历史无法追溯，可能遗漏潜在故障隐患'
          : '',
        score: borrowData.disassemblyRecord ? 10 : 0,
        maxScore: 10,
        isCorrect: borrowData.disassemblyRecord,
        mastered: borrowData.disassemblyRecord
      });
    }

    if (currentTask.requireWorkCardNumber) {
      borrowScore.push({
        step: '工卡号填写', field: 'workCardNumber',
        userAction: borrowData.workCardNumber ? `填写工卡号：${borrowData.workCardNumber}` : '未填写工卡号',
        correctAction: '必须填写工卡号',
        riskNote: !borrowData.workCardNumber.trim()
          ? '未填写工卡号将导致维修记录无法追溯，一旦发生故障无法定位责任人'
          : '',
        score: borrowData.workCardNumber.trim() ? 10 : 0,
        maxScore: 10,
        isCorrect: !!borrowData.workCardNumber.trim(),
        mastered: !!borrowData.workCardNumber.trim()
      });
    }

    const returnScore: ScoreItem[] = [];

    const partStatusCorrect = returnData.partStatus !== 'unknown';
    returnScore.push({
      step: '拆下件状态选择', field: 'partStatus',
      userAction: `选择状态：${returnData.partStatus === 'good' ? '良好' : returnData.partStatus === 'damaged' ? '损坏' : '未知'}`,
      correctAction: '应明确标注故障状态',
      riskNote: !partStatusCorrect
        ? '状态不明导致部件后续无法正确处置，可能将故障件误判为可用件装机'
        : '',
      score: partStatusCorrect ? 10 : 5,
      maxScore: 10,
      isCorrect: partStatusCorrect,
      mastered: partStatusCorrect
    });

    const repairTagCorrect = (returnData.partStatus === 'damaged' && returnData.hasRepairTag) ||
      (returnData.partStatus !== 'damaged' && !returnData.hasRepairTag);
    returnScore.push({
      step: '待修牌确认', field: 'hasRepairTag',
      userAction: returnData.hasRepairTag ? '已挂待修牌' : '未挂待修牌',
      correctAction: returnData.partStatus === 'damaged' ? '故障件必须挂待修牌' : '良好状态无需挂待修牌',
      riskNote: !repairTagCorrect && returnData.partStatus === 'damaged'
        ? '未挂待修牌导致故障件可能被误当可用件发出，造成重复故障甚至空中停车'
        : '',
      score: repairTagCorrect ? 10 : 0,
      maxScore: 10,
      isCorrect: repairTagCorrect,
      mastered: repairTagCorrect
    });

    returnScore.push({
      step: '附件齐套检查', field: 'accessoriesComplete',
      userAction: returnData.accessoriesComplete ? '确认附件齐套' : '附件不齐套',
      correctAction: '确认附件齐套',
      riskNote: !returnData.accessoriesComplete
        ? '附件不齐套将导致安装时缺件，可能引发密封失效或连接松动'
        : '',
      score: returnData.accessoriesComplete ? 10 : 0,
      maxScore: 10,
      isCorrect: returnData.accessoriesComplete,
      mastered: returnData.accessoriesComplete
    });

    const totalScore = [...borrowScore, ...returnScore].reduce((s, i) => s + i.score, 0);
    const maxScore = [...borrowScore, ...returnScore].reduce((s, i) => s + i.maxScore, 0);

    const result: SimulationResult = {
      id: `result-${Date.now()}`,
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      aircraft: currentTask.aircraft,
      borrowScore,
      returnScore,
      totalScore,
      maxScore,
      completedAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    };

    setCurrentResult(result);
    console.log('[ScoreCalculation]', { result });
  }, [currentTask, borrowData, returnData]);

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

  const addResult = useCallback((result: SimulationResult) => {
    setResults(prev => {
      const next = [result, ...prev];
      saveResults(next);
      return next;
    });
    console.log('[ResultAdded]', { resultId: result.id });
  }, []);

  const updateResultItem = useCallback((resultId: string, updatedItem: ScoreItem) => {
    setResults(prev => {
      const next = prev.map(r => {
        if (r.id !== resultId) return r;
        const mapItem = (item: ScoreItem): ScoreItem =>
          item.field === updatedItem.field ? { ...updatedItem } : item;
        return {
          ...r,
          borrowScore: r.borrowScore.map(mapItem),
          returnScore: r.returnScore.map(mapItem),
          totalScore: [...r.borrowScore.map(mapItem), ...r.returnScore.map(mapItem)].reduce((s, i) => s + i.score, 0),
        };
      });
      saveResults(next);
      return next;
    });
    console.log('[ResultItemUpdated]', { resultId, field: updatedItem.field, mastered: updatedItem.mastered });
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
    console.log('[StartRetry]', config);
  }, []);

  const clearRetry = useCallback(() => {
    setRetryConfig(null);
  }, []);

  return (
    <SimulatorContext.Provider
      value={{
        currentTask, currentStep, borrowData, returnData,
        borrowFeedbacks, returnFeedbacks, currentResult, results,
        retryConfig, currentRole,
        setCurrentTask, setCurrentStep, setBorrowData, setReturnData,
        validateBorrowForm, validateReturnForm, calculateScore,
        resetSimulation, addResult, updateResultItem,
        startRetry, clearRetry, setCurrentRole
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};
