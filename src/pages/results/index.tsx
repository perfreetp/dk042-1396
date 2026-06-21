import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import { ScoreSection } from '@/components/ScoreItem';
import {
  SimulationResult, ScoreItem as ScoreItemType, RetryConfig,
  TeacherReviewItem, TeacherReviewSummary, ErrorCategoryKey,
  ERROR_CATEGORY_CONFIG, UserRole, ROLE_CONFIG
} from '@/types';
import { mockTasks } from '@/data/mockTasks';

type ViewMode = 'history' | 'review';
type ReviewFilter = 'category' | 'role' | 'task' | 'risk';

const ResultsPage: React.FC = () => {
  const {
    results, resetSimulation, startRetry,
    expandedResultId, setExpandedResultId,
    getTeacherReviewSummary, startCategoryPractice,
  } = useSimulator();

  const [internalExpanded, setInternalExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('history');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('category');
  const [activeCategory, setActiveCategory] = useState<ErrorCategoryKey | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedReviewItem, setSelectedReviewItem] = useState<TeacherReviewItem | null>(null);

  const effectiveExpanded = internalExpanded || expandedResultId;

  useEffect(() => {
    if (expandedResultId && expandedResultId !== internalExpanded) {
      setInternalExpanded(expandedResultId);
    }
  }, [expandedResultId, internalExpanded]);

  const reviewSummary = useMemo<TeacherReviewSummary>(
    () => getTeacherReviewSummary(),
    [results, getTeacherReviewSummary]
  );

  // ===== 历史记录视图（原有）统计 =====
  const stats = useMemo(() => {
    if (results.length === 0) return { count: 0, avgScore: 0, passRate: 0 };
    const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0);
    const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const avgScore = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    const passCount = results.filter(r => (r.totalScore / r.maxScore) >= 0.6).length;
    const passRate = Math.round((passCount / results.length) * 100);
    return { count: results.length, avgScore, passRate };
  }, [results]);

  const errorCount = useMemo(() => results.reduce(
    (sum, r) => sum + [...r.borrowScore, ...r.returnScore].filter(i => !i.mastered).length, 0
  ), [results]);

  const masteredCount = useMemo(() => results.reduce(
    (sum, r) => sum + [...r.borrowScore, ...r.returnScore].filter(i => i.mastered).length, 0
  ), [results]);

  const getScoreClass = (r: SimulationResult) => {
    const p = r.totalScore / r.maxScore;
    if (p >= 0.9) return styles.scoreExcellent;
    if (p >= 0.75) return styles.scoreGood;
    if (p >= 0.6) return styles.scorePass;
    return styles.scoreFail;
  };
  const getScoreLabel = (r: SimulationResult) => {
    const p = r.totalScore / r.maxScore;
    if (p >= 0.9) return '优秀';
    if (p >= 0.75) return '良好';
    if (p >= 0.6) return '及格';
    return '需加强';
  };

  const toggleExpand = (id: string) => {
    const next = effectiveExpanded === id ? null : id;
    setInternalExpanded(next);
    setExpandedResultId(next);
  };

  const handleGoToTasks = () => {
    resetSimulation();
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const handleRetryItem = (result: SimulationResult, item: ScoreItemType) => {
    const task = mockTasks.find(t => t.id === result.taskId);
    if (!task) { Taro.showToast({ title: '未找到对应任务', icon: 'none' }); return; }
    const isBorrow = result.borrowScore.some(s => s.field === item.field);
    const config: RetryConfig = { resultId: result.id, step: isBorrow ? 'borrow' : 'return', field: item.field };
    startRetry(config, task);
    Taro.switchTab({ url: '/pages/simulator/index' });
  };

  // ===== 讲评视图：列表项 → 跳详情 =====
  const handleReviewItemClick = (item: TeacherReviewItem) => {
    setSelectedReviewItem(item);
    // 同时展开对应的原结果卡片
    toggleExpand(item.resultId);
  };

  const handleStartCategoryFromReview = (cat: ErrorCategoryKey) => {
    const task = startCategoryPractice(cat);
    if (!task) { Taro.showToast({ title: '暂无可练习的任务', icon: 'none' }); return; }
    Taro.showToast({ title: '开始专项重练', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/simulator/index' }), 600);
  };

  // ===== 讲评：根据当前筛选展示的项 =====
  const filteredReviewItems = useMemo<TeacherReviewItem[]>(() => {
    let items = reviewSummary.recentItems;
    if (activeCategory) items = items.filter(i => i.category === activeCategory);
    if (activeRole) {
      // 按任务的 role 过滤
      const taskIdsOfRole = mockTasks
        .filter(t => t.roles[0] === activeRole)
        .map(t => t.id);
      items = items.filter(i => taskIdsOfRole.includes(i.taskId));
    }
    if (activeTaskId) items = items.filter(i => i.taskId === activeTaskId);
    if (reviewFilter === 'risk') items = reviewSummary.topRiskItems;
    return items;
  }, [reviewSummary, activeCategory, activeRole, activeTaskId, reviewFilter]);

  // ===== Empty =====
  if (results.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.viewTabs}>
          <View className={classnames(styles.viewTab, styles.viewTabActive)}>历史记录</View>
          <View className={styles.viewTab}>教员复盘</View>
        </View>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyTitle}>暂无练习记录</Text>
          <Text className={styles.emptyDesc}>完成一次模拟练习后，成绩将在这里展示</Text>
          <Button className={styles.emptyBtn} onClick={handleGoToTasks}>去开始练习</Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.viewTabs}>
        <View
          className={classnames(styles.viewTab, viewMode === 'history' && styles.viewTabActive)}
          onClick={() => setViewMode('history')}
        >
          📋 历史记录
        </View>
        <View
          className={classnames(styles.viewTab, viewMode === 'review' && styles.viewTabActive)}
          onClick={() => setViewMode('review')}
        >
          🎓 教员复盘
        </View>
      </View>

      {/* ========== 历史记录视图 ========== */}
      {viewMode === 'history' && (
        <>
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
                id={`result-${result.id}`}
                className={classnames(
                  styles.resultCard,
                  effectiveExpanded === result.id && styles.resultCardActive,
                  effectiveExpanded === result.id && styles.resultCardFlash
                )}
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
                      {result.mode === 'exam' && <View className={classnames(styles.metaTag, styles.metaExam)}>考试</View>}
                      {result.mode === 'practice' && <View className={classnames(styles.metaTag, styles.metaPractice)}>练习</View>}
                      {result.examId && <View className={classnames(styles.metaTag, styles.metaExam)}>组卷</View>}
                      <View className={styles.metaTag}>{result.completedAt}</View>
                    </View>
                  </View>
                </View>

                {effectiveExpanded === result.id && (
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
                      <ScoreSection title="借出环节评分" items={result.borrowScore}
                        onRetry={(item) => handleRetryItem(result, item)} />
                      <ScoreSection title="归还环节评分" items={result.returnScore}
                        onRetry={(item) => handleRetryItem(result, item)} />
                    </View>
                    <View className={styles.quickActions}>
                      <Button className={classnames(styles.actionBtn, styles.actionBtnPrimary)} onClick={handleGoToTasks}>
                        新任务
                      </Button>
                    </View>
                  </View>
                )}

                <Button className={styles.expandBtn} onClick={() => toggleExpand(result.id)}>
                  {effectiveExpanded === result.id ? '收起详情' : '查看详情'}
                </Button>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* ========== 教员复盘视图 ========== */}
      {viewMode === 'review' && (
        <ScrollView className={styles.resultList} scrollY>
          <View className={styles.reviewOverview}>
            <View className={styles.reviewOverviewGrid}>
              <View className={styles.reviewOverviewItem}>
                <Text className={styles.reviewOverviewValue}>{reviewSummary.totalCount}</Text>
                <Text className={styles.reviewOverviewLabel}>总评分项</Text>
              </View>
              <View className={classnames(styles.reviewOverviewItem, styles.masteredBg)}>
                <Text className={styles.reviewOverviewValue}>{reviewSummary.masteredCount}</Text>
                <Text className={styles.reviewOverviewLabel}>已掌握</Text>
              </View>
              <View className={classnames(styles.reviewOverviewItem, styles.pendingBg)}>
                <Text className={styles.reviewOverviewValue}>{reviewSummary.pendingCount}</Text>
                <Text className={styles.reviewOverviewLabel}>待掌握</Text>
              </View>
              <View className={classnames(styles.reviewOverviewItem, styles.rateBg)}>
                <Text className={styles.reviewOverviewValue}>
                  {reviewSummary.totalCount > 0
                    ? Math.round((reviewSummary.masteredCount / reviewSummary.totalCount) * 100)
                    : 0}%
                </Text>
                <Text className={styles.reviewOverviewLabel}>整体掌握率</Text>
              </View>
            </View>
          </View>

          <View className={styles.reviewFilterBar}>
            <View
              className={classnames(styles.reviewFilterChip, reviewFilter === 'category' && styles.reviewFilterChipActive)}
              onClick={() => { setReviewFilter('category'); setActiveCategory(null); setActiveRole(null); setActiveTaskId(null); }}
            >按错误类型</View>
            <View
              className={classnames(styles.reviewFilterChip, reviewFilter === 'role' && styles.reviewFilterChipActive)}
              onClick={() => { setReviewFilter('role'); setActiveCategory(null); setActiveRole(null); setActiveTaskId(null); }}
            >按学员身份</View>
            <View
              className={classnames(styles.reviewFilterChip, reviewFilter === 'task' && styles.reviewFilterChipActive)}
              onClick={() => { setReviewFilter('task'); setActiveCategory(null); setActiveRole(null); setActiveTaskId(null); }}
            >按任务</View>
            <View
              className={classnames(styles.reviewFilterChip, reviewFilter === 'risk' && styles.reviewFilterChipActive)}
              onClick={() => { setReviewFilter('risk'); setActiveCategory(null); setActiveRole(null); setActiveTaskId(null); }}
            >高风险项</View>
          </View>

          {/* 按错误类型 */}
          {reviewFilter === 'category' && (
            <View className={styles.reviewSection}>
              <View className={styles.reviewSectionTitle}>各类别讲评汇总</View>
              {(Object.keys(reviewSummary.byCategory) as ErrorCategoryKey[]).map(k => {
                const s = reviewSummary.byCategory[k];
                if (s.total === 0) return null;
                const isActive = activeCategory === k;
                return (
                  <View
                    key={k}
                    className={classnames(styles.reviewCard, isActive && styles.reviewCardActive)}
                  >
                    <View className={styles.reviewCardHeader} onClick={() => setActiveCategory(isActive ? null : k)}>
                      <View className={styles.reviewCardLeft}>
                        <View className={styles.catBadge}>{ERROR_CATEGORY_CONFIG[k].label}</View>
                        <View className={styles.reviewCardMeta}>
                          <Text className={styles.reviewCardMetaText}>共 {s.total} 次 · 待掌握 {s.pending}</Text>
                        </View>
                      </View>
                      <View className={styles.reviewCardRight}>
                        <View className={classnames(styles.rateCircle, s.masteryRate >= 80 ? styles.rateOk : s.masteryRate >= 60 ? styles.rateMid : styles.rateLow)}>
                          {s.masteryRate}%
                        </View>
                      </View>
                    </View>
                    {isActive && (
                      <View className={styles.reviewCardBody}>
                        <View className={styles.reviewCardSuggestion}>
                          <View className={styles.suggestionLabel}>📌 建议重练专项</View>
                          <Button
                            className={styles.suggestionBtn}
                            onClick={() => handleStartCategoryFromReview(k)}
                          >
                            开始 {ERROR_CATEGORY_CONFIG[k].label} 专项重练
                          </Button>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* 按身份 */}
          {reviewFilter === 'role' && (
            <View className={styles.reviewSection}>
              <View className={styles.reviewSectionTitle}>各身份讲评汇总</View>
              {(Object.keys(reviewSummary.byRole) as UserRole[]).map(rk => {
                const s = reviewSummary.byRole[rk];
                if (s.total === 0) return null;
                const isActive = activeRole === rk;
                return (
                  <View
                    key={rk}
                    className={classnames(styles.reviewCard, isActive && styles.reviewCardActive)}
                  >
                    <View className={styles.reviewCardHeader} onClick={() => setActiveRole(isActive ? null : rk)}>
                      <View className={styles.reviewCardLeft}>
                        <View className={styles.catBadge}>{ROLE_CONFIG[rk].label}</View>
                        <View className={styles.reviewCardMeta}>
                          <Text className={styles.reviewCardMetaText}>共 {s.total} 项 · 待掌握 {s.pending}</Text>
                          <Text className={styles.reviewCardMetaSub}>{ROLE_CONFIG[rk].description}</Text>
                        </View>
                      </View>
                      <View className={styles.reviewCardRight}>
                        <View className={classnames(styles.rateCircle, s.masteryRate >= 80 ? styles.rateOk : s.masteryRate >= 60 ? styles.rateMid : styles.rateLow)}>
                          {s.masteryRate}%
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* 按任务 */}
          {reviewFilter === 'task' && (
            <View className={styles.reviewSection}>
              <View className={styles.reviewSectionTitle}>各任务讲评汇总</View>
              {Object.entries(reviewSummary.byTask).map(([tid, s]) => {
                const isActive = activeTaskId === tid;
                return (
                  <View
                    key={tid}
                    className={classnames(styles.reviewCard, isActive && styles.reviewCardActive)}
                  >
                    <View className={styles.reviewCardHeader} onClick={() => setActiveTaskId(isActive ? null : tid)}>
                      <View className={styles.reviewCardLeft}>
                        <View className={styles.catBadge}>📝 任务</View>
                        <View className={styles.reviewCardMeta}>
                          <Text className={styles.reviewCardTitleText}>{s.title}</Text>
                          <Text className={styles.reviewCardMetaText}>共 {s.total} 项 · 待掌握 {s.pending}</Text>
                        </View>
                      </View>
                      <View className={styles.reviewCardRight}>
                        <View className={classnames(styles.rateCircle, s.masteryRate >= 80 ? styles.rateOk : s.masteryRate >= 60 ? styles.rateMid : styles.rateLow)}>
                          {s.masteryRate}%
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* 高风险项 */}
          {reviewFilter === 'risk' && (
            <View className={styles.reviewSection}>
              <View className={styles.reviewSectionTitle}>⚠️ 高风险讲评清单（含风险说明）</View>
              {reviewSummary.topRiskItems.length > 0 ? (
                reviewSummary.topRiskItems.slice(0, 15).map(item => (
                  <View key={item.id} className={styles.riskCard}>
                    <View className={styles.riskTitleRow}>
                      <View className={styles.catBadgeSmall}>{item.categoryLabel}</View>
                      <Text className={styles.riskTaskText}>{item.taskTitle}</Text>
                    </View>
                    <View className={styles.riskItemRow}>
                      <Text className={styles.riskItemLabel}>填写内容：</Text>
                      <Text className={styles.riskItemValueBad}>{item.userAction}</Text>
                    </View>
                    <View className={styles.riskItemRow}>
                      <Text className={styles.riskItemLabel}>正确做法：</Text>
                      <Text className={styles.riskItemValueGood}>{item.correctAction}</Text>
                    </View>
                    <View className={styles.riskNoteBox}>
                      <Text className={styles.riskNoteLabel}>🎯 风险说明</Text>
                      <Text className={styles.riskNoteText}>{item.riskNote}</Text>
                    </View>
                    <View className={styles.riskItemRow}>
                      <Text className={styles.riskItemLabel}>完成时间：</Text>
                      <Text className={styles.riskItemTime}>{item.completedAt}</Text>
                    </View>
                    <Button
                      className={styles.riskRetryBtn}
                      onClick={() => handleReviewItemClick(item)}
                    >查看原记录并重练</Button>
                  </View>
                ))
              ) : (
                <View className={styles.reviewEmpty}>
                  <Text>暂无高风险项，继续保持！🎉</Text>
                </View>
              )}
            </View>
          )}

          {/* 讲评清单明细 */}
          {filteredReviewItems.length > 0 && (
            <View className={styles.reviewSection}>
              <View className={styles.reviewSectionTitle}>
                讲评清单 · {filteredReviewItems.length} 项
                {(activeCategory || activeRole || activeTaskId) && (
                  <Text
                    className={styles.reviewClearFilter}
                    onClick={() => { setActiveCategory(null); setActiveRole(null); setActiveTaskId(null); }}
                  >清除筛选</Text>
                )}
              </View>
              {filteredReviewItems.slice(0, 60).map(item => {
                const isSelected = selectedReviewItem?.id === item.id;
                return (
                  <View
                    key={item.id}
                    className={classnames(styles.reviewLineCard, isSelected && styles.reviewLineCardActive)}
                    onClick={() => setSelectedReviewItem(isSelected ? null : item)}
                  >
                    <View className={styles.reviewLineTop}>
                      <View className={styles.reviewLineBadgeRow}>
                        <View className={styles.catBadgeSmall}>{item.categoryLabel}</View>
                        {!item.mastered
                          ? <View className={styles.reviewLinePending}>待掌握</View>
                          : <View className={styles.reviewLineMastered}>已掌握 ✓</View>
                        }
                      </View>
                      <Text className={styles.reviewLineTime}>{item.completedAt}</Text>
                    </View>
                    <Text className={styles.reviewLineTask}>{item.taskTitle} · {item.step}</Text>
                    <View className={styles.reviewLineTwo}>
                      <View className={styles.reviewLineCol}>
                        <Text className={styles.reviewLineLabelGood}>✓ 正确做法：</Text>
                        <Text className={styles.reviewLineTextGood}>{item.correctAction}</Text>
                      </View>
                      <View className={styles.reviewLineCol}>
                        <Text className={styles.reviewLineLabelBad}>✗ 学员填写：</Text>
                        <Text className={styles.reviewLineTextBad}>{item.userAction}</Text>
                      </View>
                    </View>
                    {item.riskNote && !item.mastered && (
                      <View className={styles.reviewLineRisk}>
                        <Text className={styles.reviewLineRiskText}>🎯 {item.riskNote}</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View className={styles.reviewLineActions}>
                        <Button
                          className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                          onClick={(e) => { e.stopPropagation(); handleReviewItemClick(item); }}
                        >查看原记录并重练</Button>
                        {!item.mastered && (
                          <Button
                            className={classnames(styles.actionBtn, styles.actionBtnSecondary)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCategoryFromReview(item.category);
                            }}
                          >练同类专项</Button>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default ResultsPage;
