import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { FormFeedback } from '@/types';

interface FeedbackTipProps {
  feedback: FormFeedback;
}

const typeConfig = {
  error: {
    icon: '!',
    bgColor: 'rgba(245, 63, 63, 0.1)',
    borderColor: 'rgba(245, 63, 63, 0.3)',
    textColor: '#F53F3F'
  },
  warning: {
    icon: 'i',
    bgColor: 'rgba(255, 125, 0, 0.1)',
    borderColor: 'rgba(255, 125, 0, 0.3)',
    textColor: '#FF7D00'
  },
  success: {
    icon: '✓',
    bgColor: 'rgba(0, 180, 42, 0.1)',
    borderColor: 'rgba(0, 180, 42, 0.3)',
    textColor: '#00B42A'
  }
};

const FeedbackTip: React.FC<FeedbackTipProps> = ({ feedback }) => {
  const config = typeConfig[feedback.type];

  return (
    <View
      className={classnames(styles.feedbackTip, styles[`type-${feedback.type}`])}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      <View
        className={styles.icon}
        style={{ backgroundColor: config.textColor }}
      >
        {config.icon}
      </View>
      <Text className={styles.message} style={{ color: config.textColor }}>
        {feedback.message}
      </Text>
    </View>
  );
};

interface FeedbackListProps {
  feedbacks: FormFeedback[];
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedbacks }) => {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <View className={styles.feedbackList}>
      {feedbacks.map((feedback, index) => (
        <FeedbackTip key={`${feedback.field}-${index}`} feedback={feedback} />
      ))}
    </View>
  );
};

export default FeedbackTip;
