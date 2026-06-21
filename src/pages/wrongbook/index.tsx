import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import {
  ERROR_CATEGORY_CONFIG, ErrorCategoryKey,
  ScoreItem, UserRole, ROLE_CONFIG, WeeklyDashboard, CategoryTrend
} from '@/types';

type FilterKey = ErrorCategoryKey | 'all' | 'bymission' | 'dashboard';

const categoryIcons: Record<ErrorCategoryKey, string> = {
  partnumber: 'ID',
  serial: 'SN',
  tag: '🏷️',
  disassembly: '📋',
  workcard: '📝',
  status: '🔍',
  repair: '⚠️',
  accessory: '🔧'
};

const keyFocusCats: ErrorCategoryKey[] = ['serial', 'tag', 'workcard', 'repair'];

const WrongbookPage: React.FC = () => {
  const {
    results, currentRole, setCurrentRole,
    startCategoryPractice, resetSimulation,
    getWeeklyDashboard, startContinuousCategoryPractice,
  } = useSimulator();
  const [filter, setFilter] = useState<FilterKey>('dashboard');

  const weekly = useMemo<WeeklyDashboard>(
    () => getWeeklyDashboard(),
    [results, getWeeklyDashboard]
  );

  // 每类错题统计
  const catStats = useMemo(() => {
    const map: Record<ErrorCategoryKey, { total: number; mastered: number; errors: number; items: Array<{ resultId: string; item: ScoreItem }> }> = {} as any;
    (Object.keys(ERROR_CATEGORY_CONFIG) as ErrorCategoryKey[]).forEach(k => {
      map[k] = { total: 0, mastered: 0, errors: 0, items: [] };
    });
    results.forEach(r => {
      const all = [...r.borrowScore, ...r.returnScore];
      all.forEach(item => {
        const cat = keyOfField(item.field);
        if (!cat) return;
        map[cat].total += 1;
        if (item.mastered) map[cat].mastered += 1;
        else { map[cat].errors += 1; map[cat].items.push({ resultId: r.id, item }); }
      });
    });
    return map;
  }, [results]);

  const totalErrors = useMemo(() => {
    return Object.values(catStats).reduce((s, c) => s + c.errors, 0);
  }, [catStats]);

  const totalItems = useMemo(() => {
    return Object.values(catStats).reduce((s, c) => s + c.total, 0);
  }, [catStats]);

  const totalMastered = useMemo(() => {
    return Object.values(catStats).reduce((s, c) => s + c.mastered, 0);
  }, [catStats]);

  const tasksMap = useMemo(() => {
    const m: Record<string, { title: string; aircraft: string; errorFields: string[] }> = {};
    results.forEach(r => {
      const errs = [...r.borrowScore, ...r.returnScore].filter(i => !i.mastered);
      if (errs.length === 0) return;
      if (!m[r.taskId]) m[r.taskId] = { title: r.taskTitle, aircraft: r.aircraft, errorFields: [] };
      errs.forEach(e => m[r.taskId].errorFields.push(`${e.step}：${e.userAction}`));
    });
    return m;
  }, [results]);

  const filteredCategories = useMemo(() => {
    const all = Object.entries(catStats) as [ErrorCategoryKey, typeof catStats[ErrorCategoryKey]][];
    if (filter === 'all') return all.filter(([, v]) => v.total > 0);
    if (filter === 'bymission') return [];
    if (filter === 'dashboard') return [];
    return all.filter(([k]) => k === filter);
  }, [filter, catStats]);

  const handlePracticeCat = (key: ErrorCategoryKey) => {
    const task = startCategoryPractice(key);
    if (!task) { Taro.showToast({ title: '暂无可练习的任务', icon: 'none' }); return; }
    Taro.showToast({ title: '开始同类练习', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/simulator/index' }), 600);
  };

  const handleContinuousPractice = (key: ErrorCategoryKey, count = 5) => {
    const task = startContinuousCategoryPractice(key, count);
    if (!task) { Taro.showToast({ title: '暂无可连续练习的任务', icon: 'none' }); return; }
    Taro.showToast({ title: `开始连续练习（${count}题）`, icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/simulator/index' }), 600);
  };

  const roles: UserRole[] = ['material_clerk', 'apprentice', 'intern'];

  // 小 Sparkline 生成 SVG path
  const buildSparkline = (daily: { masteryRate: number; total: number }[], w = 200, h = 50) => {
    const data = daily.map(d => d.total > 0 ? d.masteryRate : -1);
    const real = data.filter(v => v >= 0);
    if (real.length === 0) return null;
    let min = Math.min(...real);
    let max = Math.max(...real);
    if (min === max) { min = Math.max(0, min - 5); max = Math.min(100, max + 5); }
    const stepX = w / Math.max(data.length - 1, 1);
    const points: string[] = [];
    let lastI = 0;
    data.forEach((v, i) => {
      if (v < 0) return;
      const x = i * stepX;
      const y = h - ((v - min) / (max - min)) * (h - 8) - 4;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline
          fill="none"
          stroke="#1E5FA8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
        {points.length > 0 && (
          <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="3" fill="#1E5FA8" />
        )}
      </svg>
    );
  };

  if (results.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>错题本</Text>
          <Text className={styles.subtitle}>当前身份：{ROLE_CONFIG[currentRole].label}</Text>
        </View>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📖</Text>
          <Text className={styles.emptyText}>暂无错题记录{'\n'}完成一次练习后将自动归集错题</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>错题本</Text>
        <Text className={styles.subtitle}>当前身份：{ROLE_CONFIG[currentRole].label} · 共归集 {totalErrors} 项待掌握</Text>
      </View>

      <View className={styles.filterTabs}>
        <View
          className={classnames(styles.filterTab, filter === 'dashboard' && styles.active)}
          onClick={() => setFilter('dashboard')}
        >📊 本周看板</View>
        <View
          className={classnames(styles.filterTab, filter === 'all' && styles.active)}
          onClick={() => setFilter('all')}
        >全部</View>
        {(Object.keys(ERROR_CATEGORY_CONFIG) as ErrorCategoryKey[]).map(k => (
          <View
            key={k}
            className={classnames(styles.filterTab, filter === k && styles.active)}
            onClick={() => setFilter(k)}
          >
            {ERROR_CATEGORY_CONFIG[k].label} {catStats[k].errors > 0 && `(${catStats[k].errors})`}
          </View>
        ))}
        <View
          className={classnames(styles.filterTab, filter === 'bymission' && styles.active)}
          onClick={() => setFilter('bymission')}
        >按任务查看</View>
      </View>

      {/* =============== 看板视图 =============== */}
      {filter === 'dashboard' && (
        <ScrollView scrollY className={styles.dashboardScroll}>
          <View className={styles.dashboardHeader}>
            <View className={styles.dashboardDate}>
              📅 本周 · {weekly.startDate} ~ {weekly.endDate}
            </View>
            <View className={styles.dashboardOverallCard}>
              <View className={styles.overallRow}>
                <View className={styles.overallItem}>
                  <Text className={styles.overallValue}>{weekly.totalPractices}</Text>
                  <Text className={styles.overallLabel}>本周练习</Text>
                </View>
                <View className={styles.overallItem}>
                  <Text className={styles.overallValue}>{weekly.totalItems}</Text>
                  <Text className={styles.overallLabel}>累计题次</Text>
                </View>
                <View className={styles.overallItem}>
                  <View className={styles.overallRateRow}>
                    <Text className={styles.overallValueHighlight}>{weekly.overallMasteryRate}%</Text>
                    <Text className={classnames(
                      styles.deltaText,
                      weekly.overallMasteryRate - weekly.weekAgoMasteryRate >= 0
                        ? styles.deltaUp : styles.deltaDown
                    )}>
                      {weekly.overallMasteryRate - weekly.weekAgoMasteryRate >= 0 ? '↑' : '↓'}
                      {Math.abs(weekly.overallMasteryRate - weekly.weekAgoMasteryRate)}%
                    </Text>
                  </View>
                  <Text className={styles.overallLabel}>本周掌握率</Text>
                </View>
              </View>
              {weekly.hotCategories.length > 0 && (
                <View className={styles.overallInsights}>
                  <View className={styles.insightTag}>
                    🔥 热点：{weekly.hotCategories.map(c => ERROR_CATEGORY_CONFIG[c].label).join('、')}
                  </View>
                  {weekly.improvingCategories.length > 0 && (
                    <View className={styles.insightTag}>
                      📈 进步：{weekly.improvingCategories.map(c => ERROR_CATEGORY_CONFIG[c].label).join('、')}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* 重点 4 类趋势 */}
          <View className={styles.dashboardSection}>
            <View className={styles.dashboardSectionTitle}>
              🎯 重点分类掌握率变化
              <Text className={styles.dashboardSectionHint}>点卡片开始连续重练</Text>
            </View>

            <View className={styles.trendCardsGrid}>
              {weekly.categoryTrends
                .filter(t => keyFocusCats.includes(t.category))
                .map(t => {
                  const catStat = catStats[t.category];
                  const hasErrors = catStat.errors > 0;
                  return (
                    <View
                      key={t.category}
                      className={classnames(styles.trendCard, hasErrors ? styles.trendCardError : styles.trendCardOk)}
                    >
                      <View className={styles.trendCardHeader}>
                        <View className={styles.trendCardIcon}>{categoryIcons[t.category]}</View>
                        <View className={styles.trendCardMeta}>
                          <Text className={styles.trendCardTitle}>{t.label}</Text>
                          <View className={styles.trendCardStats}>
                            <Text className={styles.trendCardRate}>
                              {t.currentRate}%
                            </Text>
                            <Text className={classnames(
                              styles.deltaBadge,
                              t.delta >= 0 ? styles.deltaUp : styles.deltaDown
                            )}>
                              {t.delta >= 0 ? '↑' : '↓'}{Math.abs(t.delta)}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className={styles.sparklineBox}>
                        {buildSparkline(t.dailyStats)}
                      </View>

                      <View className={styles.trendCardFooter}>
                        <View className={styles.trendProgress}>
                          <View className={styles.trendProgressFill}
                            style={{
                              width: `${t.currentRate}%`,
                              background: t.currentRate >= 80
                                ? 'linear-gradient(90deg, #00B42A 0%, #7BC616 100%)'
                                : t.currentRate >= 60
                                  ? 'linear-gradient(90deg, #1E5FA8 0%, #4A90D9 100%)'
                                  : 'linear-gradient(90deg, #F53F3F 0%, #FF7D00 100%)'
                            }}
                          />
                        </View>
                        <Text className={styles.trendProgressText}>
                          {t.mastered}/{t.total} 题
                        </Text>
                      </View>

                      <View className={styles.trendCardActions}>
                        <Button
                          className={classnames(styles.trendBtnPrimary)}
                          onClick={() => handleContinuousPractice(t.category, 5)}
                        >
                          🔁 连续练 5 题
                        </Button>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>

          {/* 完整 8 类总览 */}
          <View className={styles.dashboardSection}>
            <View className={styles.dashboardSectionTitle}>📋 全分类掌握率总览</View>
            <View className={styles.fullCategoryGrid}>
              {weekly.categoryTrends.map(t => {
                const s = catStats[t.category];
                return (
                  <View
                    key={t.category}
                    className={classnames(styles.fullCatCard, s.total === 0 && styles.fullCatCardEmpty)}
                    onClick={() => s.total > 0 && handlePracticeCat(t.category)}
                  >
                    <View className={styles.fullCatTop}>
                      <View className={styles.fullCatIcon}>{categoryIcons[t.category]}</View>
                      <Text className={styles.fullCatTitle}>{t.label}</Text>
                      <Text className={styles.fullCatRate}>
                        {s.total > 0 ? t.currentRate : '—'}%
                      </Text>
                    </View>
                    <View className={styles.fullCatBar}>
                      <View
                        className={styles.fullCatBarFill}
                        style={{
                          width: `${s.total > 0 ? t.currentRate : 0}%`,
                          background: t.currentRate >= 80
                            ? '#00B42A' : t.currentRate >= 60 ? '#1E5FA8' : '#F53F3F'
                        }}
                      />
                    </View>
                    <View className={styles.fullCatBottom}>
                      <Text className={styles.fullCatStat}>
                        {s.errors > 0 ? `待掌握 ${s.errors}` : s.total > 0 ? '全部掌握 ✓' : '暂无记录'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* =============== 普通视图（按分类） =============== */}
      {filter !== 'dashboard' && filter !== 'bymission' && (
        <ScrollView scrollY>
          <View className={styles.summaryBar}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{totalItems}</Text>
              <Text className={styles.summaryLabel}>累计练习项</Text>
            </View>
            <View className={classnames(styles.summaryItem, styles.summaryError)}>
              <Text className={styles.summaryValue}>{totalErrors}</Text>
              <Text className={styles.summaryLabel}>待掌握项</Text>
            </View>
            <View className={classnames(styles.summaryItem, styles.summaryMastered)}>
              <Text className={styles.summaryValue}>
                {totalItems > 0 ? Math.round(totalMastered / totalItems * 100) : 0}%
              </Text>
              <Text className={styles.summaryLabel}>整体掌握率</Text>
            </View>
          </View>

          <View className={styles.categoryGrid}>
            {filteredCategories.length > 0 ? filteredCategories.map(([key, stat]) => {
              const rate = stat.total > 0 ? Math.round(stat.mastered / stat.total * 100) : 0;
              const cfg = ERROR_CATEGORY_CONFIG[key];
              const hasErrors = stat.errors > 0;
              return (
                <View key={key} className={classnames(styles.categoryCard, hasErrors ? styles.categoryError : styles.categoryOk)}>
                  <View className={styles.categoryHeader}>
                    <View className={classnames(styles.categoryIcon, hasErrors && styles.categoryIconError)}>
                      {categoryIcons[key]}
                    </View>
                    <Text className={styles.categoryTitle}>{cfg.label}</Text>
                  </View>
                  <Text className={styles.categoryDesc}>{cfg.description}</Text>
                  <View className={styles.categoryProgress}>
                    <View className={styles.progressBar}>
                      <View className={styles.progressFill} style={{ width: `${rate}%` }} />
                    </View>
                    <View className={styles.progressText}>
                      掌握率：{rate}% （{stat.mastered}/{stat.total}）
                    </View>
                  </View>
                  <View className={classnames(styles.categoryBadge, !hasErrors && styles.categoryBadgeOk)}>
                    {hasErrors ? `待掌握 ${stat.errors} 项` : '全部掌握'}
                  </View>
                  <View className={styles.practiceBtnRow}>
                    <Button
                      className={classnames(styles.practiceBtn, styles.practiceBtnBig)}
                      onClick={() => handleContinuousPractice(key, 5)}
                    >
                      🔁 连续练 5 题
                    </Button>
                  </View>
                  <View className={styles.practiceBtnRow}>
                    <Button
                      className={styles.practiceBtnSecondary}
                      onClick={() => handlePracticeCat(key)}
                    >
                      {hasErrors ? '练同类错题' : '继续巩固'}
                    </Button>
                  </View>
                </View>
              );
            }) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>该分类暂无题目</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* =============== 按任务视图 =============== */}
      {filter === 'bymission' && (
        <ScrollView scrollY>
          <View className={styles.taskSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>按任务归集错题</Text>
            </View>
            {Object.entries(tasksMap).length > 0 ? Object.entries(tasksMap).map(([taskId, info]) => (
              <View key={taskId} className={styles.errorTaskCard}>
                <Text className={styles.errorTaskTitle}>{info.title}</Text>
                <View className={styles.errorTaskMeta}>
                  <View className={styles.errorTaskTag}>飞机：{info.aircraft}</View>
                  <View className={styles.errorTaskTag}>任务ID：{taskId}</View>
                </View>
                <View className={styles.errorItems}>
                  {[...new Set(info.errorFields)].slice(0, 5).map((l, i) => (
                    <Text key={i} className={styles.errorItemLine}>{l}</Text>
                  ))}
                  {info.errorFields.length > 5 && (
                    <Text className={styles.errorItemLine}>...共 {info.errorFields.length} 项错误</Text>
                  )}
                </View>
              </View>
            )) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎉</Text>
                <Text className={styles.emptyText}>所有任务错题已掌握</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

function keyOfField(field: string): ErrorCategoryKey | null {
  const entries = Object.entries(ERROR_CATEGORY_CONFIG) as [ErrorCategoryKey, typeof ERROR_CATEGORY_CONFIG[ErrorCategoryKey]][];
  const f = entries.find(([, c]) => c.fields.includes(field));
  return f ? f[0] : null;
}

export default WrongbookPage;
