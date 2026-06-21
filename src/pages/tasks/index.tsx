import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import TaskCard from '@/components/TaskCard';
import { mockTasks } from '@/data/mockTasks';
import { Task, UserRole, PracticeMode, ROLE_CONFIG } from '@/types';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const TasksPage: React.FC = () => {
  const {
    setCurrentTask, setCurrentStep, currentRole, setCurrentRole, resetSimulation,
    practiceMode, setPracticeMode, startCategoryPractice,
    customExams, startCustomExam
  } = useSimulator();
  const [filter, setFilter] = useState<DifficultyFilter>('all');
  const [showExams, setShowExams] = useState(false);

  const roleFilteredTasks = useMemo(() => {
    return mockTasks.filter(task => task.roles.includes(currentRole));
  }, [currentRole]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return roleFilteredTasks;
    return roleFilteredTasks.filter(task => task.difficulty === filter);
  }, [filter, roleFilteredTasks]);

  const handleStartTask = (task: Task) => {
    resetSimulation();
    setCurrentTask(task);
    setCurrentStep('borrow');
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  const quickCats: Array<{ key: keyof typeof ERROR_CATEGORY_CONFIG; label: string; icon: string; hint: string }> = [
    { key: 'serial', label: '序号类', icon: '🔢', hint: '序号核实专项' },
    { key: 'tag', label: '标签类', icon: '🏷️', hint: '适航标签专项' },
    { key: 'workcard', label: '工卡类', icon: '📝', hint: '工卡填写专项' },
    { key: 'repair', label: '待修牌类', icon: '⚠️', hint: '待修牌专项' },
  ];

  const handleQuickCategory = (catKey: keyof typeof ERROR_CATEGORY_CONFIG) => {
    startCategoryPractice(catKey, currentRole);
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  const handleStartExam = (examId: string) => {
    const ok = startCustomExam(examId);
    if (!ok) {
      Taro.showToast({ title: '试卷不存在', icon: 'none' });
      return;
    }
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  const handleGoBuildExam = () => {
    Taro.navigateTo({ url: '/pages/exam/index' });
  };

  const difficultyFilters: { key: DifficultyFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'easy', label: '简单' },
    { key: 'medium', label: '中等' },
    { key: 'hard', label: '困难' }
  ];

  const roles: { key: UserRole; label: string; desc: string }[] = [
    { key: 'material_clerk', label: ROLE_CONFIG.material_clerk.label, desc: ROLE_CONFIG.material_clerk.description },
    { key: 'apprentice', label: ROLE_CONFIG.apprentice.label, desc: ROLE_CONFIG.apprentice.description },
    { key: 'intern', label: ROLE_CONFIG.intern.label, desc: ROLE_CONFIG.intern.description }
  ];

  const modes: { key: PracticeMode; label: string; desc: string; icon: string }[] = [
    { key: 'practice', label: '练习模式', desc: '即时提醒，反复练习', icon: '✏️' },
    { key: 'exam', label: '考试模式', desc: '模拟考试，严格记录', icon: '📝' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>练习任务</Text>
        <Text className={styles.subtitle}>当前身份：{ROLE_CONFIG[currentRole].label} · 共 {filteredTasks.length} 个任务</Text>
      </View>

      <View className={styles.roleBar}>
        {roles.map(r => (
          <View
            key={r.key}
            className={classnames(styles.roleItem, currentRole === r.key && styles.roleActive)}
            onClick={() => { setCurrentRole(r.key); setFilter('all'); }}
          >
            <Text className={styles.roleLabel}>{r.label}</Text>
            <Text className={styles.roleDesc}>{r.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionTitle}>训练模式</View>
      <View className={styles.modeBar}>
        {modes.map(m => (
          <View
            key={m.key}
            className={classnames(styles.modeItem, practiceMode === m.key && styles.modeActive)}
            onClick={() => setPracticeMode(m.key)}
          >
            <Text className={styles.modeIcon}>{m.icon}</Text>
            <View className={styles.modeTexts}>
              <Text className={styles.modeLabel}>{m.label}</Text>
              <Text className={styles.modeDesc}>{m.desc}</Text>
            </View>
            {practiceMode === m.key && <Text className={styles.modeCheck}>✓</Text>}
          </View>
        ))}
      </View>

      <View className={styles.quickSection}>
        <View className={styles.quickHeader}>
          <Text className={styles.sectionTitle}>快捷入口</Text>
          <View className={styles.buildExamBtn} onClick={handleGoBuildExam}>
            <Text className={styles.buildExamIcon}>📚</Text>
            <Text className={styles.buildExamText}>教员组卷</Text>
          </View>
        </View>
        <View className={styles.quickGrid}>
          {quickCats.map(c => (
            <View key={c.key} className={styles.quickCard} onClick={() => handleQuickCategory(c.key)}>
              <Text className={styles.quickIcon}>{c.icon}</Text>
              <Text className={styles.quickTitle}>{c.label}</Text>
              <Text className={styles.quickHint}>{c.hint}</Text>
            </View>
          ))}
        </View>
      </View>

      {customExams.length > 0 && (
        <View className={styles.examSection}>
          <View className={styles.examHeader}>
            <Text className={styles.sectionTitle}>已有试卷（{customExams.length}）</Text>
            <Text className={styles.examToggle} onClick={() => setShowExams(v => !v)}>
              {showExams ? '收起' : '展开'}
            </Text>
          </View>
          {showExams && (
            <View className={styles.examList}>
              {customExams.map(exam => (
                <View key={exam.id} className={styles.examCard} onClick={() => handleStartExam(exam.id)}>
                  <View className={styles.examTop}>
                    <Text className={styles.examTitle}>{exam.title}</Text>
                    <Text className={styles.examCount}>{exam.taskIds.length} 题</Text>
                  </View>
                  <View className={styles.examMeta}>
                    <Text className={styles.examMetaText}>身份：{ROLE_CONFIG[exam.role].label}</Text>
                    <Text className={styles.examMetaText}>{exam.createdAt}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View className={styles.sectionTitle}>任务列表</View>
      <ScrollView className={styles.filterBar} scrollX>
        {difficultyFilters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, filter === f.key && styles.active)}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.taskList} scrollY>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} currentRole={currentRole} onStart={handleStartTask} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无该难度的任务</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TasksPage;
