import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import FormItem, { InputField, CheckboxField, RadioGroup } from '@/components/FormItem';
import { FeedbackList } from '@/components/FeedbackTip';
import { ScoreSection } from '@/components/ScoreItem';
import { mockTasks } from '@/data/mockTasks';
import { ScoreItem as ScoreItemType, RetryConfig } from '@/types';

const SimulatorPage: React.FC = () => {
  const {
    currentTask,
    currentStep,
    borrowData,
    returnData,
    borrowFeedbacks,
    returnFeedbacks,
    currentResult,
    retryConfig,
    practiceMode,
    activeExamId,
    activeExamIndex,
    activeExamResults,
    customExams,
    continuousPractice,
    setCurrentStep,
    setBorrowData,
    setReturnData,
    validateBorrowForm,
    validateReturnForm,
    calculateScore,
    resetSimulation,
    addResult,
    updateResultItem,
    clearRetry,
    setExpandedResultId,
    saveCurrentExamResult,
    finishCustomExam,
    setCurrentTask,
    setActiveExamIndex,
    advanceContinuousPractice,
  } = useSimulator();

  const isRetryMode = !!retryConfig;
  const isExamMode = practiceMode === 'exam';
  const isCustomExam = !!activeExamId;
  const isContinuousPractice = !!continuousPractice;
  const exam = isCustomExam ? customExams.find(e => e.id === activeExamId) : null;

  const handleNextStep = () => {
    const blocking = !isExamMode;
    validateBorrowForm(blocking);
    if (isExamMode) {
      // 考试模式即使错误也允许下一步
      setCurrentStep('return');
      return;
    }
    // 练习模式校验通过才下一步
    const ok = validateBorrowForm(true);
    if (ok) setCurrentStep('return');
  };

  const handlePrevStep = () => {
    setCurrentStep('borrow');
  };

  const handleSubmit = () => {
    const blocking = !isExamMode;
    validateReturnForm(blocking);
    // 任何模式都生成评分
    const res = calculateScore();
    if (res) setCurrentStep('result');
  };

  const handleSaveResult = () => {
    if (!currentResult) return;
    if (isCustomExam && exam) {
      // 组卷模式：保存到当前试卷 + 下一题 or 结束
      saveCurrentExamResult(currentResult);
      const nextIdx = activeExamIndex + 1;
      if (nextIdx < exam.taskIds.length) {
        // 跳到下一题
        Taro.showToast({ title: `已完成 ${nextIdx}/${exam.taskIds.length}`, icon: 'success' });
        setTimeout(() => {
          const nextTask = mockTasks.find(t => t.id === exam.taskIds[nextIdx]);
          if (!nextTask) {
            // fallback 直接交卷
            const fr = finishCustomExam();
            if (fr) Taro.showToast({ title: '试卷已完成', icon: 'success' });
            Taro.switchTab({ url: '/pages/results/index' });
            return;
          }
          resetSimulation();
          setActiveExamIndex(nextIdx);
          setCurrentTask(nextTask);
          setCurrentStep('borrow');
        }, 900);
      } else {
        // 最后一题，交卷
        const finalResult = finishCustomExam(currentResult);
        if (finalResult) {
          Taro.showModal({
            title: '试卷完成',
            content: `总评：${finalResult.comment}\n总分：${finalResult.totalScore}/${finalResult.maxScore}（${Math.round(finalResult.totalScore / finalResult.maxScore * 100)} 分）`,
            showCancel: false,
            confirmColor: '#1E5FA8',
            success: () => Taro.switchTab({ url: '/pages/results/index' })
          });
        } else {
          Taro.showToast({ title: '试卷已完成', icon: 'success' });
          setTimeout(() => Taro.switchTab({ url: '/pages/results/index' }), 1200);
        }
      }
      return;
    }
    // 普通模式：保存
    addResult(currentResult);

    // 连续重练模式：推进下一题 or 结束
    if (isContinuousPractice && continuousPractice) {
      const curIdx = continuousPractice.currentIndex;
      const total = continuousPractice.totalTasks;
      const isLast = curIdx >= total - 1;

      if (isLast) {
        Taro.showModal({
          title: '🎉 连续练习完成',
          content: `本轮连续 ${total} 道练习已完成，可回到错题本查看掌握率变化。`,
          showCancel: true,
          cancelText: '留在本页',
          confirmText: '返回错题本',
          confirmColor: '#1E5FA8',
          success: (r) => {
            if (r.confirm) {
              Taro.switchTab({ url: '/pages/wrongbook/index' });
            }
          }
        });
        return;
      }

      // 不是最后一题：推进
      Taro.showToast({ title: `已完成 ${curIdx + 1}/${total}`, icon: 'success' });
      setTimeout(() => {
        const nextTask = advanceContinuousPractice();
        if (!nextTask) {
          // 推进失败，直接回错题本
          Taro.showToast({ title: '连续练习完成', icon: 'success' });
          setTimeout(() => Taro.switchTab({ url: '/pages/wrongbook/index' }), 1000);
        } else {
          // 下一题已经通过 advance 内部 reset 并 setCurrentTask + borrow，无需再操作
          setCurrentStep('borrow');
        }
      }, 900);
      return;
    }

    Taro.showToast({ title: '成绩已保存', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/results/index' }), 1200);
  };

  const handleRetrySubmit = () => {
    if (!retryConfig || !currentTask) return;

    // 不依赖 currentResult，直接根据当前表单构造 updatedItem
    const cat = retryConfig.field;
    let upd: ScoreItemType | null = null;

    // 先找同 category 的基准 ScoreItem（从当前模拟生成）
    const step = retryConfig.step;
    // 构造 updated
    if (step === 'borrow') {
      switch (cat) {
        case 'partNumber': {
          const ok = borrowData.partNumber.trim() === currentTask.partNumber;
          upd = { step: '件号填写', field: 'partNumber', userAction: borrowData.partNumber ? `填写件号：${borrowData.partNumber}` : '未填写件号', correctAction: `填写件号：${currentTask.partNumber}`, riskNote: ok ? '' : '件号填写错误或遗漏将导致错误部件装机', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'serialNumber': {
          const ok = borrowData.serialNumber.trim() === currentTask.serialNumber;
          upd = { step: '序号填写', field: 'serialNumber', userAction: borrowData.serialNumber ? `填写序号：${borrowData.serialNumber}` : '未填写序号', correctAction: `填写序号：${currentTask.serialNumber}`, riskNote: ok ? '' : '漏填序号导致实物无法唯一锁定', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'airworthinessTag': {
          const ok = !!borrowData.airworthinessTag;
          upd = { step: '适航标签确认', field: 'airworthinessTag', userAction: ok ? '已确认适航标签' : '未确认适航标签', correctAction: '必须确认适航标签', riskNote: ok ? '' : '未确认适航标签可能导致不合格件装机', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'disassemblyRecord': {
          const ok = !!borrowData.disassemblyRecord;
          upd = { step: '拆装记录确认', field: 'disassemblyRecord', userAction: ok ? '已确认拆装记录' : '未确认拆装记录', correctAction: '必须确认拆装记录', riskNote: ok ? '' : '未确认拆装记录将导致部件历史无法追溯', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'workCardNumber': {
          const ok = !!borrowData.workCardNumber.trim();
          upd = { step: '工卡号填写', field: 'workCardNumber', userAction: ok ? `填写工卡号：${borrowData.workCardNumber}` : '未填写工卡号', correctAction: '必须填写工卡号', riskNote: ok ? '' : '未填写工卡号将导致维修记录无法追溯', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
      }
    } else {
      switch (cat) {
        case 'partStatus': {
          const ok = returnData.partStatus !== 'unknown';
          upd = { step: '拆下件状态选择', field: 'partStatus', userAction: `选择状态：${returnData.partStatus === 'good' ? '良好' : returnData.partStatus === 'damaged' ? '损坏' : '未知'}`, correctAction: '应明确标注故障状态', riskNote: ok ? '' : '状态不明可能将故障件误判为可用件装机', score: ok ? 10 : 5, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'hasRepairTag': {
          const ok = (returnData.partStatus === 'damaged' && returnData.hasRepairTag) || (returnData.partStatus !== 'damaged' && !returnData.hasRepairTag);
          upd = { step: '待修牌确认', field: 'hasRepairTag', userAction: returnData.hasRepairTag ? '已挂待修牌' : '未挂待修牌', correctAction: returnData.partStatus === 'damaged' ? '故障件必须挂待修牌' : '良好状态无需挂待修牌', riskNote: !ok && returnData.partStatus === 'damaged' ? '未挂待修牌导致故障件可能被误当可用件发出' : '', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
        case 'accessoriesComplete': {
          const ok = !!returnData.accessoriesComplete;
          upd = { step: '附件齐套检查', field: 'accessoriesComplete', userAction: ok ? '确认附件齐套' : '附件不齐套', correctAction: '确认附件齐套', riskNote: ok ? '' : '附件不齐套将导致安装时缺件', score: ok ? 10 : 0, maxScore: 10, isCorrect: ok, mastered: ok };
          break;
        }
      }
    }

    if (upd) {
      updateResultItem(retryConfig.resultId, upd);
      setExpandedResultId(retryConfig.resultId);
      Taro.showToast({ title: upd.mastered ? '已掌握！' : '继续加油', icon: upd.mastered ? 'success' : 'none' });
      setTimeout(() => {
        clearRetry();
        resetSimulation();
        // 回到成绩回放，自动展开这条记录
        Taro.switchTab({ url: '/pages/results/index' });
      }, 1200);
    }
  };

  const handleGoBack = () => {
    resetSimulation();
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const retryField = retryConfig?.field;
  const fieldNameMap: Record<string, string> = {
    partNumber: '件号填写', serialNumber: '序号填写', airworthinessTag: '适航标签确认',
    disassemblyRecord: '拆装记录确认', workCardNumber: '工卡号填写',
    partStatus: '拆下件状态', hasRepairTag: '待修牌确认', accessoriesComplete: '附件齐套检查'
  };

  if (!currentTask) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无进行中的任务</Text>
          <Text className={styles.emptyDesc}>请先从任务列表选择一个练习任务</Text>
          <Button className={styles.emptyBtn} onClick={handleGoBack}>去选择任务</Button>
        </View>
      </View>
    );
  }

  const statusOptions = [
    { value: 'good', label: '良好', description: '部件状态良好，可直接入库' },
    { value: 'damaged', label: '损坏', description: '部件有故障或损坏，需送修' },
    { value: 'unknown', label: '未知', description: '暂时无法确定状态，需进一步检查' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.taskHeader}>
        <Text className={styles.taskTitle}>{currentTask.title}</Text>
        <Text className={styles.taskDesc}>{currentTask.description}</Text>
        <View className={styles.taskMeta}>
          <View className={styles.metaItem}>飞机：{currentTask.aircraft}</View>
          <View className={styles.metaItem}>部件：{currentTask.partName}</View>
          {isRetryMode && <View className={classnames(styles.metaItem, styles.metaRetry)}>错题重练 · {fieldNameMap[retryField || '']}</View>}
          {isExamMode && !isRetryMode && !isCustomExam && <View className={classnames(styles.metaItem, styles.metaExam)}>考试模式</View>}
          {isCustomExam && <View className={classnames(styles.metaItem, styles.metaExam)}>{exam?.title}</View>}
          {isContinuousPractice && continuousPractice && (
            <View className={classnames(styles.metaItem, styles.metaContinuous)}>
              🎯 连续练习 · {continuousPractice.currentIndex + 1}/{continuousPractice.totalTasks}
            </View>
          )}
        </View>
      </View>

      {currentStep !== 'result' && !isRetryMode && (
        <View className={styles.stepNav}>
          <View
            className={classnames(styles.stepItem, currentStep === 'borrow' && styles.active)}
            onClick={() => currentStep === 'return' && handlePrevStep()}
          >
            <Text className={styles.stepNumber}>1</Text>
            借出环节
          </View>
          <View className={classnames(styles.stepItem, currentStep === 'return' && styles.active)}>
            <Text className={styles.stepNumber}>2</Text>
            归还环节
          </View>
        </View>
      )}

      <ScrollView scrollY>
        {currentStep === 'borrow' && (
          <>
            <View className={styles.formContainer}>
              <Text className={styles.formTitle}>
                {isRetryMode && retryField
                  ? `重练：${fieldNameMap[retryField] || ''}`
                  : '借出信息登记'}
              </Text>
              <FormItem label="件号（Part Number）" required
                error={borrowFeedbacks.some(f => f.field === 'partNumber')}
                hint="请从任务卡片中查找件号">
                <InputField value={borrowData.partNumber} placeholder="请输入件号"
                  onChange={v => setBorrowData({ partNumber: v })} />
              </FormItem>
              <FormItem label="序号（Serial Number）" required
                error={borrowFeedbacks.some(f => f.field === 'serialNumber')}
                hint="序号用于锁定唯一实物">
                <InputField value={borrowData.serialNumber} placeholder="请输入序号"
                  onChange={v => setBorrowData({ serialNumber: v })} />
              </FormItem>
              <FormItem label="适航标签确认" required={currentTask.requireAirworthinessTag}
                error={borrowFeedbacks.some(f => f.field === 'airworthinessTag')}
                hint={currentTask.requireAirworthinessTag ? '该部件为关键件，必须确认' : '该部件无需适航标签'}>
                <CheckboxField checked={borrowData.airworthinessTag} label="已确认周转件带有有效适航标签"
                  onChange={c => setBorrowData({ airworthinessTag: c })} />
              </FormItem>
              <FormItem label="拆装记录确认" required={currentTask.requireDisassemblyRecord}
                error={borrowFeedbacks.some(f => f.field === 'disassemblyRecord')}
                hint={currentTask.requireDisassemblyRecord ? '需检查拆装记录' : '无需拆装记录'}>
                <CheckboxField checked={borrowData.disassemblyRecord} label="已确认拆装记录完整有效"
                  onChange={c => setBorrowData({ disassemblyRecord: c })}
                  disabled={!currentTask.requireDisassemblyRecord} />
              </FormItem>
              <FormItem label="工卡号" required={currentTask.requireWorkCardNumber}
                error={borrowFeedbacks.some(f => f.field === 'workCardNumber')}
                hint="便于后续追溯维修记录">
                <InputField value={borrowData.workCardNumber} placeholder="请输入工卡号"
                  onChange={v => setBorrowData({ workCardNumber: v })}
                  disabled={!currentTask.requireWorkCardNumber} />
              </FormItem>
            </View>
            <View className={styles.feedbackSection}>
              <FeedbackList feedbacks={borrowFeedbacks} />
              {isExamMode && borrowFeedbacks.length > 0 && borrowFeedbacks.some(f => f.type === 'error') && (
                <View className={styles.examNote}>
                  <Text className={styles.examNoteIcon}>📝</Text>
                  <Text className={styles.examNoteText}>
                    考试模式：错误会被记录，但您仍可继续作答。成绩详情会保留本次错误和风险说明。
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {currentStep === 'return' && (
          <>
            <View className={styles.formContainer}>
              <Text className={styles.formTitle}>
                {isRetryMode && retryField
                  ? `重练：${fieldNameMap[retryField] || ''}`
                  : '归还信息登记'}
              </Text>
              <FormItem label="拆下件状态" required
                error={returnFeedbacks.some(f => f.field === 'partStatus')}
                hint="请根据实际检查结果选择">
                <RadioGroup value={returnData.partStatus} options={statusOptions}
                  onChange={v => setReturnData({ partStatus: v as any })} />
              </FormItem>
              <FormItem label="待修牌状态" required={returnData.partStatus === 'damaged'}
                error={returnFeedbacks.some(f => f.field === 'hasRepairTag')}
                hint={returnData.partStatus === 'damaged' ? '损坏部件必须挂待修牌' : '良好状态无需挂待修牌'}>
                <CheckboxField checked={returnData.hasRepairTag} label="已挂红色待修牌"
                  onChange={c => setReturnData({ hasRepairTag: c })} />
              </FormItem>
              <FormItem label="附件齐套确认" required
                error={returnFeedbacks.some(f => f.field === 'accessoriesComplete')}
                hint="包括密封圈、垫片、螺栓等">
                <CheckboxField checked={returnData.accessoriesComplete} label="确认所有附件已齐套归还"
                  onChange={c => setReturnData({ accessoriesComplete: c })} />
              </FormItem>
              <FormItem label="备注说明" hint="可选填写缺损或其他需要说明的情况">
                <InputField value={returnData.remarks} placeholder="请输入备注信息（选填）"
                  onChange={v => setReturnData({ remarks: v })} />
              </FormItem>
            </View>
            <View className={styles.feedbackSection}>
              <FeedbackList feedbacks={returnFeedbacks} />
              {isExamMode && returnFeedbacks.length > 0 && returnFeedbacks.some(f => f.type === 'error') && (
                <View className={styles.examNote}>
                  <Text className={styles.examNoteIcon}>📝</Text>
                  <Text className={styles.examNoteText}>考试模式：错误会被记录，仍可提交查看评分。</Text>
                </View>
              )}
            </View>
          </>
        )}

        {currentStep === 'result' && currentResult && (
          <View className={styles.resultContainer}>
            <View className={styles.scoreCard}>
              <Text className={styles.scoreValue}>{currentResult.totalScore}</Text>
              <Text className={styles.scoreLabel}>
                总分 {currentResult.totalScore} / {currentResult.maxScore}
                {isExamMode && <Text className={styles.modeTag}> · 考试</Text>}
                {isCustomExam && <Text className={styles.modeTag}> · {exam?.title}</Text>}
              </Text>
            </View>
            <ScoreSection title="借出环节评分" items={currentResult.borrowScore} />
            <ScoreSection title="归还环节评分" items={currentResult.returnScore} />
            {isExamMode && (
              <View className={styles.instructorNote}>
                <View className={styles.instructorTitle}>📚 教员点评</View>
                {currentResult.totalScore / currentResult.maxScore >= 0.9 ? (
                  <Text className={styles.instructorText}>本次{isCustomExam ? '试卷' : '模拟'}操作规范，错误项极少，已达到上岗考核要求，建议进入实战环节。</Text>
                ) : currentResult.totalScore / currentResult.maxScore >= 0.75 ? (
                  <Text className={styles.instructorText}>整体掌握良好，已标注的错误项请在错题本中归类重练，强化记忆。</Text>
                ) : currentResult.totalScore / currentResult.maxScore >= 0.6 ? (
                  <Text className={styles.instructorText}>已达及格线，借出/归还环节都有疏漏，请在错题本按错误类型逐项训练。</Text>
                ) : (
                  <Text className={styles.instructorText}>距离合格还有差距，建议重新学习借还流程规则，再在练习模式下反复操作。</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {currentStep !== 'result' && (
        <View className={styles.bottomBar}>
          {currentStep === 'return' && !isRetryMode && !isCustomExam && (
            <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handlePrevStep}>
              上一步
            </Button>
          )}
          <Button
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={isRetryMode
              ? handleRetrySubmit
              : (currentStep === 'borrow' ? handleNextStep : handleSubmit)
            }
          >
            {isRetryMode ? '提交重练' : (currentStep === 'borrow' ? '下一步' : '提交评分')}
          </Button>
        </View>
      )}

      {currentStep === 'result' && !isRetryMode && (
        <View className={styles.bottomBar}>
          <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={() => { resetSimulation(); Taro.switchTab({ url: '/pages/tasks/index' }); }}>
            新任务
          </Button>
          <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSaveResult}>
            {isCustomExam ? '保存并交卷' : '保存成绩'}
          </Button>
        </View>
      )}
    </View>
  );
};

export default SimulatorPage;
