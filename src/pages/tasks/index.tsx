import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import TaskCard from '@/components/TaskCard';
import { mockTasks } from '@/data/mockTasks';
import { Task, UserRole, ROLE_CONFIG } from '@/types';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const TasksPage: React.FC = () => {
  const { setCurrentTask, setCurrentStep, currentRole, setCurrentRole, resetSimulation } = useSimulator();
  const [filter, setFilter] = useState<DifficultyFilter>('all');

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
