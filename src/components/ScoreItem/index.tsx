import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ScoreItem as ScoreItemType } from '@/types';

interface ScoreItemProps {
  item: ScoreItemType;
  index?: number;
  onRetry?: (item: ScoreItemType) => void;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ item, index, onRetry }) => {
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
        {item.riskNote && (
          <View className={styles.riskRow}>
            <View className={styles.riskIcon}>!</View>
            <Text className={styles.riskText}>{item.riskNote}</Text>
          </View>
        )}
        {!item.isCorrect && onRetry && (
          <View className={styles.retryRow} onClick={() => onRetry(item)}>
            <Text className={styles.retryBtn}>重练此项</Text>
          </View>
        )}
        {item.isCorrect && item.mastered && (
          <View className={styles.masteredTag}>
            <Text className={styles.masteredText}>已掌握</Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface ScoreSectionProps {
  title: string;
  items: ScoreItemType[];
  onRetry?: (item: ScoreItemType) => void;
}

export const ScoreSection: React.FC<ScoreSectionProps> = ({ title, items, onRetry }) => {
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
          <ScoreItem key={item.field} item={item} index={index} onRetry={onRetry} />
        ))}
      </View>
    </View>
  );
};

export default ScoreItem;
