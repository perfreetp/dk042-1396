import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Task, UserRole, ROLE_CONFIG } from '@/types';

interface TaskCardProps {
  task: Task;
  currentRole?: UserRole;
  onStart: (task: Task) => void;
}

const difficultyMap = {
  easy: { label: '简单', color: '#00B42A', bg: '#E8FFEA' },
  medium: { label: '中等', color: '#FF7D00', bg: '#FFF7E6' },
  hard: { label: '困难', color: '#F53F3F', bg: '#FFECE8' }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, currentRole, onStart }) => {
  const difficulty = difficultyMap[task.difficulty];
  const focusTip = currentRole ? task.roleFocus[currentRole] : '';

  return (
    <View className={styles.taskCard}>
      <View className={styles.cardHeader}>
        <View className={styles.taskTitle}>
          <Text className={styles.titleText}>{task.title}</Text>
          <View
            className={styles.difficultyTag}
            style={{ backgroundColor: difficulty.bg, color: difficulty.color }}
          >
            {difficulty.label}
          </View>
        </View>
        <Text className={styles.aircraft}>飞机注册号：{task.aircraft}</Text>
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.description}>{task.description}</Text>
        <View className={styles.partInfo}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>部件名称：</Text>
            <Text className={styles.infoValue}>{task.partName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>件号：</Text>
            <Text className={styles.infoValue}>{task.partNumber}</Text>
          </View>
        </View>

        {focusTip && (
          <View className={styles.focusTip}>
            <View className={styles.focusIcon}>i</View>
            <View className={styles.focusContent}>
              <Text className={styles.focusRole}>{ROLE_CONFIG[currentRole!].label}重点：</Text>
              <Text className={styles.focusText}>{focusTip}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.cardFooter}>
        <Button
          className={styles.startBtn}
          onClick={() => onStart(task)}
        >
          开始练习
        </Button>
      </View>
    </View>
  );
};

export default TaskCard;
