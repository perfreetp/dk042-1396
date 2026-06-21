import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import { mockTasks } from '@/data/mockTasks';
import { Task, UserRole, ROLE_CONFIG, ErrorCategoryKey, ERROR_CATEGORY_CONFIG } from '@/types';

type FocusFilter = 'all' | ErrorCategoryKey;

const ExamBuilderPage: React.FC = () => {
  const {
    currentRole, setCurrentRole,
    createCustomExam, startCustomExam,
  } = useSimulator();
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterFocus, setFilterFocus] = useState<FocusFilter>('all');

  const roleTasks = useMemo(
    () => mockTasks.filter(t => t.roles.includes(currentRole)),
    [currentRole]
  );

  const displayTasks = useMemo(() => {
    if (filterFocus === 'all') return roleTasks;
    // 按错误类别筛选：看任务是否包含该类别对应的字段
    const cfg = ERROR_CATEGORY_CONFIG[filterFocus];
    if (!cfg) return roleTasks;
    return roleTasks.filter(t => {
      // 借出环节
      if (cfg.fields.includes('airworthinessTag') && !t.requireAirworthinessTag) return false;
      if (cfg.fields.includes('disassemblyRecord') && !t.requireDisassemblyRecord) return false;
      if (cfg.fields.includes('workCardNumber') && !t.requireWorkCardNumber) return false;
      // 件号/序号是所有任务都有
      // 归还环节三类（status/repair/accessory）所有任务都有
      return true;
    });
  }, [filterFocus, roleTasks]);

  const focusFilters: { key: FocusFilter; label: string }[] = [
    { key: 'all', label: '全部题' },
    ...(Object.keys(ERROR_CATEGORY_CONFIG) as ErrorCategoryKey[]).map(k => ({
      key: k,
      label: ERROR_CATEGORY_CONFIG[k].label,
    })),
  ];

  const taskFocusTags = (t: Task): string[] => {
    const tags: string[] = [];
    if (t.requireAirworthinessTag) tags.push('标签');
    if (t.requireDisassemblyRecord) tags.push('拆装记录');
    if (t.requireWorkCardNumber) tags.push('工卡');
    tags.push('件号序号');
    tags.push('状态判断');
    tags.push('待修牌');
    tags.push('附件齐套');
    return tags.slice(0, 4);
  };

  const toggleTask = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllDisplayed = () => {
    const allDisplayedIds = displayTasks.map(t => t.id);
    const allSelected = allDisplayedIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(i => !allDisplayedIds.includes(i)));
    } else {
      const union = Array.from(new Set([...selectedIds, ...allDisplayedIds]));
      setSelectedIds(union);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入试卷名称', icon: 'none' });
      return;
    }
    if (selectedIds.length < 1) {
      Taro.showToast({ title: '请至少选择 1 题', icon: 'none' });
      return;
    }
    const exam = createCustomExam({
      title: title.trim(),
      role: currentRole,
      taskIds: selectedIds,
    });
    Taro.showModal({
      title: '组卷完成',
      content: `已创建「${exam.title}」（${exam.taskIds.length} 题）\n是否立即开始？`,
      confirmText: '立即开始',
      cancelText: '稍后再做',
      confirmColor: '#1E5FA8',
      success: (res) => {
        if (res.confirm) {
          const ok = startCustomExam(exam.id);
          if (ok) {
            Taro.switchTab({ url: '/pages/simulator/index' });
          } else {
            Taro.showToast({ title: '启动失败', icon: 'none' });
          }
        } else {
          Taro.showToast({ title: '已保存试卷', icon: 'success' });
          setTimeout(() => Taro.navigateBack({ delta: 1 }), 800);
        }
      }
    });
  };

  const getDifficultyLabel = (d: string) => d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难';
  const getDifficultyClass = (d: string) =>
    d === 'easy' ? styles.diffEasy : d === 'medium' ? styles.diffMedium : styles.diffHard;

  return (
    <View className={styles.page}>
      <View className={styles.toolbar}>
        <Text className={styles.back} onClick={() => Taro.navigateBack()}>← 返回</Text>
        <Text className={styles.pageTitle}>教员组卷</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.card}>
          <Text className={styles.cardLabel}>目标身份</Text>
          <View className={styles.roleBar}>
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => (
              <View
                key={r}
                className={classnames(styles.roleChip, currentRole === r && styles.roleChipActive)}
                onClick={() => { setCurrentRole(r); setSelectedIds([]); }}
              >
                <Text className={styles.roleChipLabel}>{ROLE_CONFIG[r].label}</Text>
                <Text className={styles.roleChipDesc}>{ROLE_CONFIG[r].description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardLabel}>试卷名称</Text>
          <Input
            className={styles.titleInput}
            placeholder="例如：航材员期中考前训练 · 第 1 套"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={40}
          />
          <View className={styles.titlePresetRow}>
            {['期中考前训练 1', '重点错题复盘', '新人上岗通关'].map(p => (
              <Text
                key={p}
                className={styles.titlePreset}
                onClick={() => setTitle(p)}
              >{p}</Text>
            ))}
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardLabel}>按练习重点筛选</Text>
            <Text className={styles.selectedCount}>已选 {selectedIds.length} / {roleTasks.length}</Text>
          </View>
          <ScrollView className={styles.focusBar} scrollX>
            {focusFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.focusChip, filterFocus === f.key && styles.focusChipActive)}
                onClick={() => setFilterFocus(f.key)}
              >{f.label}</View>
            ))}
          </ScrollView>
          <View className={styles.checkAllRow}>
            <View
              className={classnames(styles.checkAll,
                displayTasks.length > 0 && displayTasks.every(t => selectedIds.includes(t.id)) && styles.checkAllOn)}
              onClick={toggleAllDisplayed}
            >
              <Text>{displayTasks.length > 0 && displayTasks.every(t => selectedIds.includes(t.id)) ? '☑' : '☐'}</Text>
              <Text className={styles.checkAllText}>全选当前视图</Text>
            </View>
            {selectedIds.length > 0 && (
              <Text className={styles.clearSelected} onClick={() => setSelectedIds([])}>清空选择</Text>
            )}
          </View>

          <View className={styles.taskList}>
            {displayTasks.length > 0 ? (
              displayTasks.map((t, idx) => {
                const on = selectedIds.includes(t.id);
                const focusTags = taskFocusTags(t);
                return (
                  <View
                    key={t.id}
                    className={classnames(styles.taskItem, on && styles.taskItemOn)}
                    onClick={() => toggleTask(t.id)}
                  >
                    <View className={styles.taskCheckbox}>
                      <Text className={on ? styles.checkOn : styles.checkOff}>
                        {on ? '☑' : '☐'}
                      </Text>
                    </View>
                    <View className={styles.taskMain}>
                      <View className={styles.taskTop}>
                        <Text className={styles.taskIndex}>#{idx + 1}</Text>
                        <Text className={styles.taskTitle}>{t.title}</Text>
                      </View>
                      <Text className={styles.taskDesc}>{t.description}</Text>
                      <View className={styles.taskFoot}>
                        <View className={classnames(styles.diffTag, getDifficultyClass(t.difficulty))}>
                          {getDifficultyLabel(t.difficulty)}
                        </View>
                        <View className={styles.focusTagRow}>
                          {focusTags.map(f => (
                            <Text key={f} className={styles.focusTag}>{f}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className={styles.emptyHint}>
                <Text>当前重点下没有题目，换一个筛选试试？</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.bottomInfo}>
          <Text className={styles.bottomInfoText}>已选 {selectedIds.length} 题</Text>
          {selectedIds.length > 0 && (
            <Text className={styles.bottomInfoSub}>
              身份：{ROLE_CONFIG[currentRole].label}
            </Text>
          )}
        </View>
        <Button
          className={classnames(styles.submitBtn, selectedIds.length < 1 && styles.submitBtnDisabled)}
          onClick={handleCreate}
        >生成试卷</Button>
      </View>
    </View>
  );
};

export default ExamBuilderPage;
