import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import { mockTasks } from '@/data/mockTasks';
import { Task, UserRole, ROLE_CONFIG, ErrorCategoryKey, ERROR_CATEGORY_CONFIG, CustomExam } from '@/types';

type FocusFilter = 'all' | ErrorCategoryKey;
type PageView = 'builder' | 'saved';

const ExamBuilderPage: React.FC = () => {
  const {
    currentRole, setCurrentRole,
    createCustomExam, saveExamDraft, duplicateCustomExam, updateCustomExam,
    deleteCustomExam, startCustomExam, customExams,
  } = useSimulator();

  const [pageView, setPageView] = useState<PageView>('builder');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterFocus, setFilterFocus] = useState<FocusFilter>('all');

  // 当切换到编辑模式时，填入数据
  const loadExamIntoForm = useCallback((exam: CustomExam) => {
    setEditingId(exam.id);
    setTitle(exam.title.replace(/\s*\(副本\)$/, '') + ' (编辑)');
    setSelectedIds([...exam.taskIds]);
    if (exam.role !== currentRole) setCurrentRole(exam.role);
    setPageView('builder');
  }, [currentRole, setCurrentRole]);

  const roleTasks = useMemo(
    () => mockTasks.filter(t => t.roles.includes(currentRole)),
    [currentRole]
  );

  const displayTasks = useMemo(() => {
    if (filterFocus === 'all') return roleTasks;
    const cfg = ERROR_CATEGORY_CONFIG[filterFocus];
    if (!cfg) return roleTasks;
    return roleTasks.filter(t => {
      if (cfg.fields.includes('airworthinessTag') && !t.requireAirworthinessTag) return false;
      if (cfg.fields.includes('disassemblyRecord') && !t.requireDisassemblyRecord) return false;
      if (cfg.fields.includes('workCardNumber') && !t.requireWorkCardNumber) return false;
      return true;
    });
  }, [filterFocus, roleTasks]);

  const focusFilters: { key: FocusFilter; label: string }[] = [
    { key: 'all', label: '全部题' },
    ...(Object.keys(ERROR_CATEGORY_CONFIG) as ErrorCategoryKey[]).map(k => ({
      key: k, label: ERROR_CATEGORY_CONFIG[k].label,
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

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSelectedIds([]);
    setFilterFocus('all');
  };

  const handleSaveDraft = () => {
    if (selectedIds.length < 1) {
      Taro.showToast({ title: '请至少选择 1 题', icon: 'none' });
      return;
    }
    if (editingId) {
      updateCustomExam(editingId, {
        title: title.trim() || '未命名试卷',
        role: currentRole,
        taskIds: selectedIds,
      });
      Taro.showToast({ title: '已更新', icon: 'success' });
    } else {
      saveExamDraft({
        title: title.trim() || '未命名草稿',
        role: currentRole,
        taskIds: selectedIds,
      });
      Taro.showToast({ title: '草稿已保存', icon: 'success' });
    }
    setPageView('saved');
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
    let examId: string;
    if (editingId) {
      updateCustomExam(editingId, {
        title: title.trim(),
        role: currentRole,
        taskIds: selectedIds,
      });
      examId = editingId;
    } else {
      const exam = createCustomExam({
        title: title.trim(),
        role: currentRole,
        taskIds: selectedIds,
      });
      examId = exam.id;
    }
    Taro.showModal({
      title: '组卷完成',
      content: `已创建「${title.trim()}」（${selectedIds.length} 题）\n是否立即开始？`,
      confirmText: '立即开始',
      cancelText: '稍后再做',
      confirmColor: '#1E5FA8',
      success: (res) => {
        if (res.confirm) {
          const ok = startCustomExam(examId);
          if (ok) {
            Taro.switchTab({ url: '/pages/simulator/index' });
          } else {
            Taro.showToast({ title: '启动失败', icon: 'none' });
          }
        } else {
          Taro.showToast({ title: '已保存试卷', icon: 'success' });
          resetForm();
          setPageView('saved');
        }
      }
    });
  };

  const handleStartSaved = (exam: CustomExam) => {
    const ok = startCustomExam(exam.id);
    if (ok) {
      Taro.showToast({ title: '开始答题', icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/simulator/index' }), 500);
    } else {
      Taro.showToast({ title: '启动失败', icon: 'none' });
    }
  };

  const handleCopy = (exam: CustomExam) => {
    const copy = duplicateCustomExam(exam.id);
    if (!copy) return;
    Taro.showToast({ title: '已复制', icon: 'success' });
    setTimeout(() => loadExamIntoForm(copy), 500);
  };

  const handleDelete = (exam: CustomExam) => {
    Taro.showModal({
      title: '确认删除',
      content: `删除「${exam.title}」后将无法恢复，确认删除？`,
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          deleteCustomExam(exam.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const getDifficultyLabel = (d: string) => d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难';
  const getDifficultyClass = (d: string) =>
    d === 'easy' ? styles.diffEasy : d === 'medium' ? styles.diffMedium : styles.diffHard;

  const examTypeLabel = (e: CustomExam) => {
    switch (e.createdBy) {
      case 'draft': return { text: '草稿', cls: styles.examTypeDraft };
      case 'copy': return { text: '副本', cls: styles.examTypeCopy };
      default: return { text: '正式', cls: styles.examTypeFormal };
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.toolbar}>
        <Text className={styles.back} onClick={() => {
          if (pageView === 'saved' || !editingId) Taro.navigateBack();
          else { setPageView('saved'); resetForm(); }
        }}>← 返回</Text>
        <Text className={styles.pageTitle}>教员组卷</Text>
        <View className={styles.toolbarRight}>
          <View
            className={classnames(styles.viewSwitch, pageView === 'builder' && styles.viewSwitchActive)}
            onClick={() => setPageView('builder')}
          >组卷</View>
          <View
            className={classnames(styles.viewSwitch, pageView === 'saved' && styles.viewSwitchActive)}
            onClick={() => setPageView('saved')}
          >
            已存试卷 {customExams.length > 0 && <Text className={styles.badge}>{customExams.length}</Text>}
          </View>
        </View>
      </View>

      {/* ===== 组卷编辑视图 ===== */}
      {pageView === 'builder' && (
        <ScrollView className={styles.content} scrollY>
          {editingId && (
            <View className={styles.editBanner}>
              <Text className={styles.editBannerText}>📝 正在编辑已存试卷，保存后会更新原试卷</Text>
              <Text className={styles.editBannerClear} onClick={() => { resetForm(); }}>新建空白</Text>
            </View>
          )}

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

          <View style={{ height: 200 }} />
        </ScrollView>
      )}

      {/* ===== 已存试卷列表视图 ===== */}
      {pageView === 'saved' && (
        <ScrollView className={styles.content} scrollY>
          <View className={styles.savedHeader}>
            <View className={styles.savedHeaderInfo}>
              <Text className={styles.savedHeaderTitle}>已存试卷</Text>
              <Text className={styles.savedHeaderSub}>共 {customExams.length} 套</Text>
            </View>
            <View className={styles.savedHeaderAction} onClick={() => { resetForm(); setPageView('builder'); }}>
              <Text className={styles.savedHeaderActionText}>＋ 新建组卷</Text>
            </View>
          </View>

          {customExams.length > 0 ? (
            customExams.map(exam => {
              const typeInfo = examTypeLabel(exam);
              const taskTitles = exam.taskIds
                .map(tid => mockTasks.find(t => t.id === tid)?.title?.slice(0, 12) || '已删除')
                .slice(0, 3);
              return (
                <View key={exam.id} className={styles.examCard}>
                  <View className={styles.examCardHeader}>
                    <View className={styles.examCardTitleRow}>
                      <View className={classnames(styles.examTypeTag, typeInfo.cls)}>{typeInfo.text}</View>
                      <Text className={styles.examCardTitle}>{exam.title}</Text>
                    </View>
                    <View className={styles.examCardMeta}>
                      <View className={styles.metaChip}>
                        <Text className={styles.metaChipLabel}>身份：</Text>
                        <Text className={styles.metaChipValue}>{ROLE_CONFIG[exam.role].label}</Text>
                      </View>
                      <View className={styles.metaChip}>
                        <Text className={styles.metaChipLabel}>题数：</Text>
                        <Text className={styles.metaChipValue}>{exam.taskIds.length} 题</Text>
                      </View>
                      {exam.updatedAt && (
                        <View className={styles.metaChip}>
                          <Text className={styles.metaChipValue}>{exam.updatedAt}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className={styles.examCardBody}>
                    <Text className={styles.examTaskHint}>包含任务：</Text>
                    <View className={styles.examTaskList}>
                      {taskTitles.map((t, i) => (
                        <Text key={i} className={styles.examTaskItem}>• {t}…</Text>
                      ))}
                      {exam.taskIds.length > 3 && (
                        <Text className={styles.examTaskMore}>+ 还有 {exam.taskIds.length - 3} 题</Text>
                      )}
                    </View>
                  </View>
                  <View className={styles.examCardActions}>
                    <View className={styles.examActionBtn} onClick={() => handleStartSaved(exam)}>
                      <Text className={styles.examActionPrimary}>▶ 开始练习</Text>
                    </View>
                    <View className={styles.examActionBtn} onClick={() => loadExamIntoForm(exam)}>
                      <Text className={styles.examActionText}>✏️ 编辑</Text>
                    </View>
                    <View className={styles.examActionBtn} onClick={() => handleCopy(exam)}>
                      <Text className={styles.examActionText}>📋 复制</Text>
                    </View>
                    <View className={styles.examActionBtn} onClick={() => handleDelete(exam)}>
                      <Text className={styles.examActionDanger}>🗑 删除</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.savedEmpty}>
              <Text className={styles.savedEmptyIcon}>📚</Text>
              <Text className={styles.savedEmptyTitle}>暂无已存试卷</Text>
              <Text className={styles.savedEmptyDesc}>新建一份组卷，或从草稿中生成一套正式试卷</Text>
              <View className={styles.savedEmptyBtn} onClick={() => { resetForm(); setPageView('builder'); }}>
                <Text className={styles.savedEmptyBtnText}>＋ 开始组卷</Text>
              </View>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* 底部固定栏（仅组卷编辑视图） */}
      {pageView === 'builder' && (
        <View className={styles.bottomBar}>
          <View className={styles.bottomInfo}>
            <Text className={styles.bottomInfoText}>已选 {selectedIds.length} 题</Text>
            {selectedIds.length > 0 && (
              <Text className={styles.bottomInfoSub}>身份：{ROLE_CONFIG[currentRole].label}</Text>
            )}
          </View>
          <View className={styles.bottomActions}>
            <Button
              className={classnames(styles.draftBtn)}
              onClick={handleSaveDraft}
              disabled={selectedIds.length < 1}
            >存草稿</Button>
            <Button
              className={classnames(styles.submitBtn, selectedIds.length < 1 && styles.submitBtnDisabled)}
              onClick={handleCreate}
            >生成试卷</Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ExamBuilderPage;
