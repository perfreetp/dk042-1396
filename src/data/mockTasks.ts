import { Task, SimulationResult } from '@/types';

export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: '液压泵渗漏更换',
    description: 'B-XXXX 航后发现液压泵渗漏，需要借一件可用周转件',
    aircraft: 'B-1234',
    partName: '液压泵',
    partNumber: 'HYD-PUMP-001',
    serialNumber: 'SN-HYD-2024-0001',
    difficulty: 'easy',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-002',
    title: '起落架指示灯更换',
    description: 'B-5678 航前检查发现左主起落架指示灯故障，需更换指示灯',
    aircraft: 'B-5678',
    partName: '起落架指示灯',
    partNumber: 'LG-LIGHT-002',
    serialNumber: 'SN-LG-2024-0015',
    difficulty: 'easy',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: false,
    requireWorkCardNumber: true
  },
  {
    id: 'task-003',
    title: '雷达罩锁扣维修',
    description: 'B-9012 定检中发现雷达罩锁扣机构磨损，需拆下送修并借备用件',
    aircraft: 'B-9012',
    partName: '雷达罩锁扣机构',
    partNumber: 'RADAR-LOCK-003',
    serialNumber: 'SN-RAD-2024-0008',
    difficulty: 'medium',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-004',
    title: '空调组件更换',
    description: 'B-3456 巡航中左空调组件失效，返航后需立即更换',
    aircraft: 'B-3456',
    partName: '空调组件',
    partNumber: 'ACM-UNIT-004',
    serialNumber: 'SN-ACM-2024-0022',
    difficulty: 'hard',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-005',
    title: '导航天线更换',
    description: 'B-7890 VOR导航信号不稳定，检查发现天线故障',
    aircraft: 'B-7890',
    partName: 'VOR导航天线',
    partNumber: 'NAV-ANT-005',
    serialNumber: 'SN-NAV-2024-0031',
    difficulty: 'medium',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-006',
    title: '燃油泵更换',
    description: 'B-2345 左油箱燃油泵低压警告，需更换燃油泵',
    aircraft: 'B-2345',
    partName: '燃油泵',
    partNumber: 'FUEL-PUMP-006',
    serialNumber: 'SN-FUEL-2024-0017',
    difficulty: 'hard',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-007',
    title: '客舱座椅维修',
    description: 'B-6789 32A座椅调节机构损坏，需更换部件',
    aircraft: 'B-6789',
    partName: '座椅调节机构',
    partNumber: 'SEAT-MECH-007',
    serialNumber: 'SN-SEAT-2024-0045',
    difficulty: 'easy',
    requireAirworthinessTag: false,
    requireDisassemblyRecord: false,
    requireWorkCardNumber: false
  },
  {
    id: 'task-008',
    title: 'APU起动电机更换',
    description: 'B-0123 APU起动困难，检查发现起动电机碳刷磨损严重',
    aircraft: 'B-0123',
    partName: 'APU起动电机',
    partNumber: 'APU-STRT-008',
    serialNumber: 'SN-APU-2024-0009',
    difficulty: 'hard',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-009',
    title: '气象雷达收发机更换',
    description: 'B-4567 气象雷达显示异常，需更换收发机',
    aircraft: 'B-4567',
    partName: '气象雷达收发机',
    partNumber: 'WXR-XCVR-009',
    serialNumber: 'SN-WXR-2024-0012',
    difficulty: 'medium',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  },
  {
    id: 'task-010',
    title: '刹车组件更换',
    description: 'B-8901 左主起落架刹车磨损超标，需更换刹车组件',
    aircraft: 'B-8901',
    partName: '刹车组件',
    partNumber: 'BRAKE-ASSY-010',
    serialNumber: 'SN-BRAKE-2024-0028',
    difficulty: 'medium',
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true
  }
];

export const mockResults: SimulationResult[] = [
  {
    id: 'result-001',
    taskId: 'task-001',
    taskTitle: '液压泵渗漏更换',
    aircraft: 'B-1234',
    borrowScore: [
      {
        step: '件号填写',
        userAction: '填写件号：HYD-PUMP-001',
        correctAction: '填写件号：HYD-PUMP-001',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '序号填写',
        userAction: '未填写序号',
        correctAction: '填写序号：SN-HYD-2024-0001',
        score: 0,
        maxScore: 10,
        isCorrect: false
      },
      {
        step: '适航标签确认',
        userAction: '已确认适航标签',
        correctAction: '已确认适航标签',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '拆装记录确认',
        userAction: '已确认拆装记录',
        correctAction: '已确认拆装记录',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '工卡号填写',
        userAction: '填写工卡号：WC-2024-001',
        correctAction: '填写工卡号',
        score: 10,
        maxScore: 10,
        isCorrect: true
      }
    ],
    returnScore: [
      {
        step: '拆下件状态选择',
        userAction: '选择状态：损坏',
        correctAction: '选择状态：损坏',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '待修牌确认',
        userAction: '已挂待修牌',
        correctAction: '已挂待修牌',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '附件齐套检查',
        userAction: '确认附件齐套',
        correctAction: '确认附件齐套',
        score: 10,
        maxScore: 10,
        isCorrect: true
      }
    ],
    totalScore: 80,
    maxScore: 80,
    completedAt: '2024-06-15 14:30'
  },
  {
    id: 'result-002',
    taskId: 'task-002',
    taskTitle: '起落架指示灯更换',
    aircraft: 'B-5678',
    borrowScore: [
      {
        step: '件号填写',
        userAction: '填写件号：LG-LIGHT-002',
        correctAction: '填写件号：LG-LIGHT-002',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '序号填写',
        userAction: '填写序号：SN-LG-2024-0015',
        correctAction: '填写序号：SN-LG-2024-0015',
        score: 10,
        maxScore: 10,
        isCorrect: true
      },
      {
        step: '适航标签确认',
        userAction: '未确认适航标签',
        correctAction: '必须确认适航标签',
        score: 0,
        maxScore: 10,
        isCorrect: false
      },
      {
        step: '工卡号填写',
        userAction: '未填写工卡号',
        correctAction: '必须填写工卡号',
        score: 0,
        maxScore: 10,
        isCorrect: false
      }
    ],
    returnScore: [
      {
        step: '拆下件状态选择',
        userAction: '选择状态：未知',
        correctAction: '应明确标注故障状态',
        score: 5,
        maxScore: 10,
        isCorrect: false
      },
      {
        step: '待修牌确认',
        userAction: '未挂待修牌',
        correctAction: '故障件必须挂待修牌',
        score: 0,
        maxScore: 10,
        isCorrect: false
      },
      {
        step: '附件齐套检查',
        userAction: '确认附件齐套',
        correctAction: '确认附件齐套',
        score: 10,
        maxScore: 10,
        isCorrect: true
      }
    ],
    totalScore: 45,
    maxScore: 70,
    completedAt: '2024-06-16 09:15'
  }
];
