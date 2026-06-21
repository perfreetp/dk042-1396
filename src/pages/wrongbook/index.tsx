import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import {
  ERROR_CATEGORY_CONFIG, ErrorCategoryKey,
  ScoreItem, SimulationResult, UserRole, ROLE_CONFIG
} from '@/types';

type FilterKey = ErrorCategoryKey | 'all' | 'bymission';

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

const WrongbookPage: React.FC = () => {
  const { results, currentRole, setCurrentRole, startCategoryPractice, resetSimulation } = useSimulator();
  const [filter, setFilter] = useState<FilterKey>('all');

  // 汇总每类错题：每个 category 统计 total 次/ mastered 次/ errors 次
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
        else map[cat].errors += 1, map[cat].items.push({ resultId: r.id, item });
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
    return all.filter(([k]) => k === filter);
  }, [filter, catStats]);

  const handlePracticeCat = (key: ErrorCategoryKey) => {
    const task = startCategoryPractice(key);
    if (!task) {
      Taro.showToast({ title: '暂无可练习的任务', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '开始同类练习', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/simulator/index' }), 800);
  };

  const roles: UserRole[] = ['material_clerk', 'apprentice', 'intern'];

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
          <Text className={styles.summaryValue}>{totalItems > 0 ? Math.round(totalMastered / totalItems * 100) : 0}%</Text>
          <Text className={styles.summaryLabel}>整体掌握率</Text>
        </View>
      </View>

      <View className={styles.filterTabs}>
        <View className={classnames(styles.filterTab, filter === 'all' && styles.active)} onClick={() => setFilter('all')}>全部</View>
        {(Object.keys(ERROR_CATEGORY_CONFIG) as ErrorCategoryKey[]).map(k => (
          <View
            key={k}
            className={classnames(styles.filterTab, filter === k && styles.active)}
            onClick={() => setFilter(k)}
          >
            {ERROR_CATEGORY_CONFIG[k].label} {catStats[k].errors > 0 && `(${catStats[k].errors})`}
          </View>
        ))}
        <View className={classnames(styles.filterTab, filter === 'bymission' && styles.active)} onClick={() => setFilter('bymission')}>按任务查看</View>
      </View>

      <ScrollView scrollY>
        {(filter === 'all' || (filter !== 'all' && filter !== 'bymission')) && (
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
                  <Button className={styles.practiceBtn} onClick={() => handlePracticeCat(key)}>
                    {hasErrors ? '练同类错题' : '继续巩固'}
                  </Button>
                </View>
              );
            }) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>该分类暂无题目</Text>
              </View>
            )}
          </View>
        )}

        {filter === 'bymission' && (
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
        )}
      </ScrollView>
    </View>
  );
};

function keyOfField(field: string): ErrorCategoryKey | null {
  const entries = Object.entries(ERROR_CATEGORY_CONFIG) as [ErrorCategoryKey, typeof ERROR_CATEGORY_CONFIG[ErrorCategoryKey]][];
  const f = entries.find(([, c]) => c.fields.includes(field));
  return f ? f[0] : null;
}

export default WrongbookPage;
