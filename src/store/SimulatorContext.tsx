import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, BorrowFormData, ReturnFormData, SimulatorStep, ScoreItem, SimulationResult, FormFeedback } from '@/types';

interface SimulatorContextType {
  currentTask: Task | null;
  currentStep: SimulatorStep;
  borrowData: BorrowFormData;
  returnData: ReturnFormData;
  borrowFeedbacks: FormFeedback[];
  returnFeedbacks: FormFeedback[];
  currentResult: SimulationResult | null;
  results: SimulationResult[];
  setCurrentTask: (task: Task | null) => void;
  setCurrentStep: (step: SimulatorStep) => void;
  setBorrowData: (data: Partial<BorrowFormData>) => void;
  setReturnData: (data: Partial<ReturnFormData>) => void;
  validateBorrowForm: () => boolean;
  validateReturnForm: () => boolean;
  calculateScore: () => void;
  resetSimulation: () => void;
  addResult: (result: SimulationResult) => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};

interface SimulatorProviderProps {
  children: ReactNode;
  initialResults: SimulationResult[];
}

export const SimulatorProvider: React.FC<SimulatorProviderProps> = ({ children, initialResults }) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentStep, setCurrentStep] = useState<SimulatorStep>('borrow');
  const [borrowData, setBorrowDataState] = useState<BorrowFormData>({
    partNumber: '',
    serialNumber: '',
    airworthinessTag: false,
    disassemblyRecord: false,
    workCardNumber: ''
  });
  const [returnData, setReturnDataState] = useState<ReturnFormData>({
    partStatus: 'unknown',
    hasRepairTag: false,
    accessoriesComplete: false,
    remarks: ''
  });
  const [borrowFeedbacks, setBorrowFeedbacks] = useState<FormFeedback[]>([]);
  const [returnFeedbacks, setReturnFeedbacks] = useState<FormFeedback[]>([]);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [results, setResults] = useState<SimulationResult[]>(initialResults);

  const setBorrowData = useCallback((data: Partial<BorrowFormData>) => {
    setBorrowDataState(prev => ({ ...prev, ...data }));
  }, []);

  const setReturnData = useCallback((data: Partial<ReturnFormData>) => {
    setReturnDataState(prev => ({ ...prev, ...data }));
  }, []);

  const validateBorrowForm = useCallback((): boolean => {
    const feedbacks: FormFeedback[] = [];
    let isValid = true;

    if (!borrowData.partNumber.trim()) {
      feedbacks.push({
        field: 'partNumber',
        message: '请填写件号，件号是识别周转件的基础信息',
        type: 'error'
      });
      isValid = false;
    }

    if (!borrowData.serialNumber.trim()) {
      feedbacks.push({
        field: 'serialNumber',
        message: '只填件号无法锁定实物，请补录序号',
        type: 'error'
      });
      isValid = false;
    } else if (currentTask && borrowData.serialNumber.trim() !== currentTask.serialNumber) {
      feedbacks.push({
        field: 'serialNumber',
        message: '序号与任务信息不符，请核对后重新输入',
        type: 'error'
      });
      isValid = false;
    }

    if (currentTask?.requireAirworthinessTag && !borrowData.airworthinessTag) {
      feedbacks.push({
        field: 'airworthinessTag',
        message: '该部件为关键周转件，必须确认适航标签',
        type: 'error'
      });
      isValid = false;
    } else if (!currentTask?.requireAirworthinessTag && borrowData.airworthinessTag) {
      feedbacks.push({
        field: 'airworthinessTag',
        message: '提示：该部件无需适航标签，您已额外确认',
        type: 'warning'
      });
    }

    if (currentTask?.requireDisassemblyRecord && !borrowData.disassemblyRecord) {
      feedbacks.push({
        field: 'disassemblyRecord',
        message: '该部件需要检查拆装记录，请确认',
        type: 'error'
      });
      isValid = false;
    }

    if (currentTask?.requireWorkCardNumber && !borrowData.workCardNumber.trim()) {
      feedbacks.push({
        field: 'workCardNumber',
        message: '请填写工卡号，便于后续追溯维修记录',
        type: 'error'
      });
      isValid = false;
    }

    if (isValid && feedbacks.length === 0) {
      feedbacks.push({
        field: 'all',
        message: '借出信息填写完整，可以进入归还环节',
        type: 'success'
      });
    }

    setBorrowFeedbacks(feedbacks);
    console.log('[BorrowValidation]', { isValid, feedbacks, borrowData, task: currentTask });
    return isValid;
  }, [borrowData, currentTask]);

  const validateReturnForm = useCallback((): boolean => {
    const feedbacks: FormFeedback[] = [];
    let isValid = true;

    if (returnData.partStatus === 'unknown') {
      feedbacks.push({
        field: 'partStatus',
        message: '请明确选择拆下件状态（良好/损坏），便于后续维修安排',
        type: 'error'
      });
      isValid = false;
    }

    if (returnData.partStatus === 'damaged' && !returnData.hasRepairTag) {
      feedbacks.push({
        field: 'hasRepairTag',
        message: '损坏部件必须挂待修牌，防止误用',
        type: 'error'
      });
      isValid = false;
    }

    if (returnData.partStatus === 'good' && returnData.hasRepairTag) {
      feedbacks.push({
        field: 'hasRepairTag',
        message: '提示：良好状态部件无需挂待修牌',
        type: 'warning'
      });
    }

    if (!returnData.accessoriesComplete) {
      feedbacks.push({
        field: 'accessoriesComplete',
        message: '请确认附件是否齐套，缺失附件需在备注中说明',
        type: 'error'
      });
      isValid = false;
    }

    if (isValid && feedbacks.length === 0) {
      feedbacks.push({
        field: 'all',
        message: '归还信息填写完整，可以查看评分结果',
        type: 'success'
      });
    }

    setReturnFeedbacks(feedbacks);
    console.log('[ReturnValidation]', { isValid, feedbacks, returnData });
    return isValid;
  }, [returnData]);

  const calculateScore = useCallback(() => {
    if (!currentTask) return;

    const borrowScore: ScoreItem[] = [];
    const returnScore: ScoreItem[] = [];

    borrowScore.push({
      step: '件号填写',
      userAction: borrowData.partNumber ? `填写件号：${borrowData.partNumber}` : '未填写件号',
      correctAction: `填写件号：${currentTask.partNumber}`,
      score: borrowData.partNumber.trim() === currentTask.partNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.partNumber.trim() === currentTask.partNumber
    });

    borrowScore.push({
      step: '序号填写',
      userAction: borrowData.serialNumber ? `填写序号：${borrowData.serialNumber}` : '未填写序号',
      correctAction: `填写序号：${currentTask.serialNumber}`,
      score: borrowData.serialNumber.trim() === currentTask.serialNumber ? 10 : 0,
      maxScore: 10,
      isCorrect: borrowData.serialNumber.trim() === currentTask.serialNumber
    });

    if (currentTask.requireAirworthinessTag) {
      borrowScore.push({
        step: '适航标签确认',
        userAction: borrowData.airworthinessTag ? '已确认适航标签' : '未确认适航标签',
        correctAction: '必须确认适航标签',
        score: borrowData.airworthinessTag ? 10 : 0,
        maxScore: 10,
        isCorrect: borrowData.airworthinessTag
      });
    }

    if (currentTask.requireDisassemblyRecord) {
      borrowScore.push({
        step: '拆装记录确认',
        userAction: borrowData.disassemblyRecord ? '已确认拆装记录' : '未确认拆装记录',
        correctAction: '必须确认拆装记录',
        score: borrowData.disassemblyRecord ? 10 : 0,
        maxScore: 10,
        isCorrect: borrowData.disassemblyRecord
      });
    }

    if (currentTask.requireWorkCardNumber) {
      borrowScore.push({
        step: '工卡号填写',
        userAction: borrowData.workCardNumber ? `填写工卡号：${borrowData.workCardNumber}` : '未填写工卡号',
        correctAction: '必须填写工卡号',
        score: borrowData.workCardNumber.trim() ? 10 : 0,
        maxScore: 10,
        isCorrect: !!borrowData.workCardNumber.trim()
      });
    }

    returnScore.push({
      step: '拆下件状态选择',
      userAction: `选择状态：${returnData.partStatus === 'good' ? '良好' : returnData.partStatus === 'damaged' ? '损坏' : '未知'}`,
      correctAction: '应明确标注故障状态',
      score: returnData.partStatus !== 'unknown' ? 10 : (returnData.partStatus === 'unknown' ? 5 : 0),
      maxScore: 10,
      isCorrect: returnData.partStatus !== 'unknown'
    });

    returnScore.push({
      step: '待修牌确认',
      userAction: returnData.hasRepairTag ? '已挂待修牌' : '未挂待修牌',
      correctAction: returnData.partStatus === 'damaged' ? '故障件必须挂待修牌' : '良好状态无需挂待修牌',
      score: (returnData.partStatus === 'damaged' && returnData.hasRepairTag) ||
             (returnData.partStatus !== 'damaged' && !returnData.hasRepairTag) ? 10 : 0,
      maxScore: 10,
      isCorrect: (returnData.partStatus === 'damaged' && returnData.hasRepairTag) ||
                 (returnData.partStatus !== 'damaged' && !returnData.hasRepairTag)
    });

    returnScore.push({
      step: '附件齐套检查',
      userAction: returnData.accessoriesComplete ? '确认附件齐套' : '附件不齐套',
      correctAction: '确认附件齐套',
      score: returnData.accessoriesComplete ? 10 : 0,
      maxScore: 10,
      isCorrect: returnData.accessoriesComplete
    });

    const totalScore = [...borrowScore, ...returnScore].reduce((sum, item) => sum + item.score, 0);
    const maxScore = [...borrowScore, ...returnScore].reduce((sum, item) => sum + item.maxScore, 0);

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
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setCurrentResult(result);
    console.log('[ScoreCalculation]', { result, borrowScore, returnScore, totalScore, maxScore });
  }, [currentTask, borrowData, returnData]);

  const resetSimulation = useCallback(() => {
    setCurrentTask(null);
    setCurrentStep('borrow');
    setBorrowDataState({
      partNumber: '',
      serialNumber: '',
      airworthinessTag: false,
      disassemblyRecord: false,
      workCardNumber: ''
    });
    setReturnDataState({
      partStatus: 'unknown',
      hasRepairTag: false,
      accessoriesComplete: false,
      remarks: ''
    });
    setBorrowFeedbacks([]);
    setReturnFeedbacks([]);
    setCurrentResult(null);
    console.log('[SimulationReset]');
  }, []);

  const addResult = useCallback((result: SimulationResult) => {
    setResults(prev => [result, ...prev]);
    console.log('[ResultAdded]', { resultId: result.id });
  }, []);

  return (
    <SimulatorContext.Provider
      value={{
        currentTask,
        currentStep,
        borrowData,
        returnData,
        borrowFeedbacks,
        returnFeedbacks,
        currentResult,
        results,
        setCurrentTask,
        setCurrentStep,
        setBorrowData,
        setReturnData,
        validateBorrowForm,
        validateReturnForm,
        calculateScore,
        resetSimulation,
        addResult
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};
