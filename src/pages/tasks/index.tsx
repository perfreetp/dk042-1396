import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import TaskCard from '@/components/TaskCard';
import { mockTasks } from '@/data/mockTasks';
import { Task } from '@/types';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const TasksPage: React.FC = () => {
  const { setCurrentTask, setCurrentStep } = useSimulator();
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return mockTasks;
    return mockTasks.filter(task => task.difficulty === filter);
  }, [filter]);

  const handleStartTask = (task: Task) => {
    console.log('[TasksPage] Starting task:', { taskId: task.id, title: task.title });
    setCurrentTask(task);
    setCurrentStep('borrow');
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  const filters: { key: DifficultyFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'easy', label: '简单' },
    { key: 'medium', label: '中等' },
    { key: 'hard', label: '困难' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>练习任务</Text>
        <Text className={styles.subtitle}>共 {mockTasks.length} 个任务可练习</Text>
      </View>

      <ScrollView className={styles.filterBar} scrollX>
        {filters.map(f => (
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
            <TaskCard key={task.id} task={task} onStart={handleStartTask} />
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
