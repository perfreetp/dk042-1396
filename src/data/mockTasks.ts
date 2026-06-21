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
    roles: ['material_clerk', 'apprentice', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '重点核实件号与序号一致性，确认适航标签有效性',
      apprentice: '重点核实拆装记录完整性，准确填写工卡号',
      intern: '完整练习借出归还全流程，注意每个必填项'
    }
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
    roles: ['material_clerk', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: false,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '件号序号必须精准对应，适航标签是关键件必查项',
      apprentice: '此任务无需拆装记录，但工卡号必须填写',
      intern: '注意适航标签确认，练习简化流程的借还操作'
    }
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
    roles: ['material_clerk', 'apprentice', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '核实件号序号，确保借出的备用件与需求一致',
      apprentice: '拆装记录必须与工卡对应，注意送修标记',
      intern: '练习中等难度任务，关注所有必填项'
    }
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
    roles: ['apprentice', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '航材紧急出库，件号序号核实不可省略',
      apprentice: 'AOG任务拆装记录和工卡号一样不能少',
      intern: '高难度任务，所有环节必须完整操作'
    }
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
    roles: ['material_clerk', 'apprentice'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '导航设备件号务必准确，适航标签缺一不可',
      apprentice: '导航设备拆装记录与工卡号必须对应',
      intern: '导航类部件更换，需特别注意适航要求'
    }
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
    roles: ['material_clerk', 'apprentice'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '燃油系统件号序号核实务必准确，标签确认不可遗漏',
      apprentice: '燃油系统拆装记录须详细，工卡号要准确对应',
      intern: '高难度任务，燃油系统操作需格外谨慎'
    }
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
    roles: ['intern'],
    requireAirworthinessTag: false,
    requireDisassemblyRecord: false,
    requireWorkCardNumber: false,
    roleFocus: {
      material_clerk: '客舱件无适航标签要求，但件号序号仍需核实',
      apprentice: '此任务无需拆装记录和工卡号，适合入门练习',
      intern: '入门级任务，练习基本借还流程'
    }
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
    roles: ['material_clerk', 'apprentice'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: 'APU关键件件号序号必须对应，适航标签严禁遗漏',
      apprentice: 'APU拆装记录要完整，工卡号与任务单一致',
      intern: '高难度任务，所有环节需严格执行'
    }
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
    roles: ['material_clerk', 'apprentice', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '雷达收发机件号易混淆，序号核实是关键',
      apprentice: '雷达设备拆装记录必须与工卡号对应',
      intern: '中等难度，注意适航标签和拆装记录'
    }
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
    roles: ['apprentice', 'intern'],
    requireAirworthinessTag: true,
    requireDisassemblyRecord: true,
    requireWorkCardNumber: true,
    roleFocus: {
      material_clerk: '刹车组件件号需精确匹配，适航标签为必查项',
      apprentice: '刹车组件拆装记录和工卡号是评分重点',
      intern: '起落架系统任务，所有步骤须认真完成'
    }
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
        field: 'partNumber',
        userAction: '填写件号：HYD-PUMP-001',
        correctAction: '填写件号：HYD-PUMP-001',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '序号填写',
        field: 'serialNumber',
        userAction: '未填写序号',
        correctAction: '填写序号：SN-HYD-2024-0001',
        riskNote: '漏填序号导致实物无法唯一锁定，一旦混件将无法追溯源头，存在严重适航隐患',
        score: 0,
        maxScore: 10,
        isCorrect: false,
        mastered: false
      },
      {
        step: '适航标签确认',
        field: 'airworthinessTag',
        userAction: '已确认适航标签',
        correctAction: '必须确认适航标签',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '拆装记录确认',
        field: 'disassemblyRecord',
        userAction: '已确认拆装记录',
        correctAction: '必须确认拆装记录',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '工卡号填写',
        field: 'workCardNumber',
        userAction: '填写工卡号：WC-2024-001',
        correctAction: '必须填写工卡号',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      }
    ],
    returnScore: [
      {
        step: '拆下件状态选择',
        field: 'partStatus',
        userAction: '选择状态：损坏',
        correctAction: '应明确标注故障状态',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '待修牌确认',
        field: 'hasRepairTag',
        userAction: '已挂待修牌',
        correctAction: '故障件必须挂待修牌',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '附件齐套检查',
        field: 'accessoriesComplete',
        userAction: '确认附件齐套',
        correctAction: '确认附件齐套',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
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
        field: 'partNumber',
        userAction: '填写件号：LG-LIGHT-002',
        correctAction: '填写件号：LG-LIGHT-002',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '序号填写',
        field: 'serialNumber',
        userAction: '填写序号：SN-LG-2024-0015',
        correctAction: '填写序号：SN-LG-2024-0015',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      },
      {
        step: '适航标签确认',
        field: 'airworthinessTag',
        userAction: '未确认适航标签',
        correctAction: '必须确认适航标签',
        riskNote: '未确认适航标签可能导致不合格件装机，危及飞行安全，属于严重适航违规',
        score: 0,
        maxScore: 10,
        isCorrect: false,
        mastered: false
      },
      {
        step: '工卡号填写',
        field: 'workCardNumber',
        userAction: '未填写工卡号',
        correctAction: '必须填写工卡号',
        riskNote: '未填写工卡号将导致维修记录无法追溯，一旦发生故障无法定位责任人',
        score: 0,
        maxScore: 10,
        isCorrect: false,
        mastered: false
      }
    ],
    returnScore: [
      {
        step: '拆下件状态选择',
        field: 'partStatus',
        userAction: '选择状态：未知',
        correctAction: '应明确标注故障状态',
        riskNote: '状态不明导致部件后续无法正确处置，可能将故障件误判为可用件装机',
        score: 5,
        maxScore: 10,
        isCorrect: false,
        mastered: false
      },
      {
        step: '待修牌确认',
        field: 'hasRepairTag',
        userAction: '未挂待修牌',
        correctAction: '故障件必须挂待修牌',
        riskNote: '未挂待修牌导致故障件可能被误当可用件发出，造成重复故障甚至空中停车',
        score: 0,
        maxScore: 10,
        isCorrect: false,
        mastered: false
      },
      {
        step: '附件齐套检查',
        field: 'accessoriesComplete',
        userAction: '确认附件齐套',
        correctAction: '确认附件齐套',
        riskNote: '',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        mastered: true
      }
    ],
    totalScore: 45,
    maxScore: 70,
    completedAt: '2024-06-16 09:15'
  }
];
