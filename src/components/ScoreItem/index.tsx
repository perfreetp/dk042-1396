import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ScoreItem as ScoreItemType } from '@/types';

interface ScoreItemProps {
  item: ScoreItemType;
  index?: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ item, index }) => {
  return (
    <View className={classnames(styles.scoreItem, item.isCorrect ? styles.correct : styles.incorrect)}>
      <View className={styles.itemHeader}>
        <View className={styles.stepIndex}>{index !== undefined ? index + 1 : ''}</View>
        <View className={styles.stepInfo}>
          <Text className={styles.stepName}>{item.step}</Text>
          <View className={styles.scoreBadge}>
            <Text className={classnames(styles.score, item.isCorrect ? styles.scoreCorrect : styles.scoreIncorrect)}>
              {item.score}
            </Text>
            <Text className={styles.maxScore}>/{item.maxScore}</Text>
          </View>
        </View>
        <View className={classnames(styles.statusIcon, item.isCorrect ? styles.statusCorrect : styles.statusIncorrect)}>
          {item.isCorrect ? '✓' : '✗'}
        </View>
      </View>

      <View className={styles.itemBody}>
        <View className={styles.actionRow}>
          <Text className={styles.actionLabel}>您的操作：</Text>
          <Text className={classnames(styles.actionValue, !item.isCorrect && styles.userActionWrong)}>
            {item.userAction}
          </Text>
        </View>
        {!item.isCorrect && (
          <View className={styles.correctRow}>
            <Text className={styles.correctLabel}>正确做法：</Text>
            <Text className={styles.correctValue}>{item.correctAction}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface ScoreSectionProps {
  title: string;
  items: ScoreItemType[];
}

export const ScoreSection: React.FC<ScoreSectionProps> = ({ title, items }) => {
  const sectionScore = items.reduce((sum, item) => sum + item.score, 0);
  const sectionMaxScore = items.reduce((sum, item) => sum + item.maxScore, 0);

  return (
    <View className={styles.scoreSection}>
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>{title}</Text>
        <View className={styles.sectionScore}>
          <Text className={styles.sectionScoreValue}>{sectionScore}</Text>
          <Text className={styles.sectionScoreMax}>/{sectionMaxScore}</Text>
        </View>
      </View>
      <View className={styles.sectionBody}>
        {items.map((item, index) => (
          <ScoreItem key={item.step} item={item} index={index} />
        ))}
      </View>
    </View>
  );
};

export default ScoreItem;
