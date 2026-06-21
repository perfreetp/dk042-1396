import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import { ScoreSection } from '@/components/ScoreItem';
import { SimulationResult, ScoreItem as ScoreItemType, RetryConfig } from '@/types';
import { mockTasks } from '@/data/mockTasks';

const ResultsPage: React.FC = () => {
  const { results, resetSimulation, startRetry } = useSimulator();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (results.length === 0) return { count: 0, avgScore: 0, passRate: 0 };
    const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0);
    const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const avgScore = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    const passCount = results.filter(r => (r.totalScore / r.maxScore) >= 0.6).length;
    const passRate = Math.round((passCount / results.length) * 100);
    return { count: results.length, avgScore, passRate };
  }, [results]);

  const errorCount = useMemo(() => {
    return results.reduce((sum, r) => {
      return sum + [...r.borrowScore, ...r.returnScore].filter(i => !i.isCorrect).length;
    }, 0);
  }, [results]);

  const masteredCount = useMemo(() => {
    return results.reduce((sum, r) => {
      return sum + [...r.borrowScore, ...r.returnScore].filter(i => i.mastered).length;
    }, 0);
  }, [results]);

  const getScoreClass = (result: SimulationResult) => {
    const p = result.totalScore / result.maxScore;
    if (p >= 0.9) return styles.scoreExcellent;
    if (p >= 0.75) return styles.scoreGood;
    if (p >= 0.6) return styles.scorePass;
    return styles.scoreFail;
  };

  const getScoreLabel = (result: SimulationResult) => {
    const p = result.totalScore / result.maxScore;
    if (p >= 0.9) return '优秀';
    if (p >= 0.75) return '良好';
    if (p >= 0.6) return '及格';
    return '需加强';
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGoToTasks = () => {
    resetSimulation();
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const handleRetryItem = (result: SimulationResult, item: ScoreItemType) => {
    const task = mockTasks.find(t => t.id === result.taskId);
    if (!task) {
      Taro.showToast({ title: '未找到对应任务', icon: 'none' });
      return;
    }

    const isBorrow = result.borrowScore.some(s => s.field === item.field);
    const config: RetryConfig = {
      resultId: result.id,
      step: isBorrow ? 'borrow' : 'return',
      field: item.field
    };

    startRetry(config, task);
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  if (results.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyTitle}>暂无练习记录</Text>
          <Text className={styles.emptyDesc}>完成一次模拟练习后，成绩将在这里展示</Text>
          <Button className={styles.emptyBtn} onClick={handleGoToTasks}>
            去开始练习
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.statsContainer}>
        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.count}</Text>
              <Text className={styles.statLabel}>练习次数</Text>
            </View>
            <View className={styles.divider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.avgScore}%</Text>
              <Text className={styles.statLabel}>平均正确率</Text>
            </View>
            <View className={styles.divider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.passRate}%</Text>
              <Text className={styles.statLabel}>通过率</Text>
            </View>
          </View>
          <View className={styles.statsSubRow}>
            <View className={styles.statSubItem}>
              <Text className={styles.statSubValue}>{errorCount}</Text>
              <Text className={styles.statSubLabel}>待掌握项</Text>
            </View>
            <View className={styles.statSubItem}>
              <Text className={styles.statSubValue}>{masteredCount}</Text>
              <Text className={styles.statSubLabel}>已掌握项</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>历史记录</Text>
        <Text className={styles.sectionCount}>共 {results.length} 条</Text>
      </View>

      <ScrollView className={styles.resultList} scrollY>
        {results.map((result) => (
          <View
            key={result.id}
            className={classnames(styles.resultCard, expandedId === result.id && styles.resultCardActive)}
          >
            <View className={styles.resultHeader}>
              <View className={classnames(styles.scoreCircle, getScoreClass(result))}>
                <Text className={styles.scoreCircleText}>
                  {Math.round((result.totalScore / result.maxScore) * 100)}
                </Text>
              </View>
              <View className={styles.resultInfo}>
                <Text className={styles.resultTitle}>{result.taskTitle}</Text>
                <View className={styles.resultMeta}>
                  <View className={styles.metaTag}>飞机：{result.aircraft}</View>
                  <View className={styles.metaTag}>{getScoreLabel(result)}</View>
                  <View className={styles.metaTag}>{result.completedAt}</View>
                </View>
              </View>
            </View>

            {expandedId === result.id && (
              <View className={styles.resultBody}>
                <View className={styles.scoreSummary}>
                  <View className={styles.scoreSummaryItem}>
                    <Text className={styles.scoreSummaryValue}>
                      {result.borrowScore.reduce((s, i) => s + i.score, 0)}/
                      {result.borrowScore.reduce((s, i) => s + i.maxScore, 0)}
                    </Text>
                    <Text className={styles.scoreSummaryLabel}>借出环节</Text>
                  </View>
                  <View className={styles.scoreSummaryItem}>
                    <Text className={styles.scoreSummaryValue}>
                      {result.returnScore.reduce((s, i) => s + i.score, 0)}/
                      {result.returnScore.reduce((s, i) => s + i.maxScore, 0)}
                    </Text>
                    <Text className={styles.scoreSummaryLabel}>归还环节</Text>
                  </View>
                </View>

                <View className={styles.detailSection}>
                  <ScoreSection
                    title="借出环节评分"
                    items={result.borrowScore}
                    onRetry={(item) => handleRetryItem(result, item)}
                  />
                  <ScoreSection
                    title="归还环节评分"
                    items={result.returnScore}
                    onRetry={(item) => handleRetryItem(result, item)}
                  />
                </View>

                <View className={styles.quickActions}>
                  <Button
                    className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                    onClick={handleGoToTasks}
                  >
                    新任务
                  </Button>
                </View>
              </View>
            )}

            <Button
              className={styles.expandBtn}
              onClick={() => toggleExpand(result.id)}
            >
              {expandedId === result.id ? '收起详情' : '查看详情'}
            </Button>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ResultsPage;
