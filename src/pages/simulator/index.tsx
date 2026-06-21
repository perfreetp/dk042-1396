import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSimulator } from '@/store/SimulatorContext';
import FormItem, { InputField, CheckboxField, RadioGroup } from '@/components/FormItem';
import { FeedbackList } from '@/components/FeedbackTip';
import { ScoreSection } from '@/components/ScoreItem';

const SimulatorPage: React.FC = () => {
  const {
    currentTask,
    currentStep,
    borrowData,
    returnData,
    borrowFeedbacks,
    returnFeedbacks,
    currentResult,
    setCurrentStep,
    setBorrowData,
    setReturnData,
    validateBorrowForm,
    validateReturnForm,
    calculateScore,
    resetSimulation,
    addResult
  } = useSimulator();

  const handleNextStep = () => {
    const isValid = validateBorrowForm();
    if (isValid) {
      setCurrentStep('return');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep('borrow');
  };

  const handleSubmit = () => {
    const isValid = validateReturnForm();
    if (isValid) {
      calculateScore();
      setCurrentStep('result');
    }
  };

  const handleSaveResult = () => {
    if (currentResult) {
      addResult(currentResult);
      Taro.showToast({
        title: '成绩已保存',
        icon: 'success'
      });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/results/index' });
      }, 1500);
    }
  };

  const handleGoBack = () => {
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  if (!currentTask) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无进行中的任务</Text>
          <Text className={styles.emptyDesc}>请先从任务列表选择一个练习任务</Text>
          <Button className={styles.emptyBtn} onClick={handleGoBack}>
            去选择任务</Button>
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
        </View>
      </View>

      {currentStep !== 'result' && (
        <View className={styles.stepNav}>
          <View
            className={classnames(styles.stepItem, currentStep === 'borrow' && styles.active)}
            onClick={() => currentStep === 'return' && handlePrevStep()}
          >
            <Text className={styles.stepNumber}>1</Text>
            借出环节
          </View>
          <View
            className={classnames(styles.stepItem, currentStep === 'return' && styles.active)}
          >
            <Text className={styles.stepNumber}>2</Text>
            归还环节
          </View>
        </View>
      )}

      <ScrollView scrollY>
        {currentStep === 'borrow' && (
          <>
            <View className={styles.formContainer}>
              <Text className={styles.formTitle}>借出信息登记</Text>

              <FormItem
                label="件号（Part Number）"
                required
                error={borrowFeedbacks.some(f => f.field === 'partNumber')}
                hint="请从任务卡片中查找件号"
              >
                <InputField
                  value={borrowData.partNumber}
                  placeholder="请输入件号"
                  onChange={(value) => setBorrowData({ partNumber: value })}
                />
              </FormItem>

              <FormItem
                label="序号（Serial Number）"
                required
                error={borrowFeedbacks.some(f => f.field === 'serialNumber')}
                hint="序号用于锁定唯一实物"
              >
                <InputField
                  value={borrowData.serialNumber}
                  placeholder="请输入序号"
                  onChange={(value) => setBorrowData({ serialNumber: value })}
                />
              </FormItem>

              <FormItem
                label="适航标签确认"
                required={currentTask.requireAirworthinessTag}
                error={borrowFeedbacks.some(f => f.field === 'airworthinessTag')}
                hint={currentTask.requireAirworthinessTag ? '该部件为关键件，必须确认' : '该部件无需适航标签'}
              >
                <CheckboxField
                  checked={borrowData.airworthinessTag}
                  label="已确认周转件带有有效适航标签"
                  onChange={(checked) => setBorrowData({ airworthinessTag: checked })}
                />
              </FormItem>

              <FormItem
                label="拆装记录确认"
                required={currentTask.requireDisassemblyRecord}
                error={borrowFeedbacks.some(f => f.field === 'disassemblyRecord')}
                hint={currentTask.requireDisassemblyRecord ? '该部件需要检查拆装记录' : '该部件无需拆装记录'}
              >
                <CheckboxField
                  checked={borrowData.disassemblyRecord}
                  label="已确认拆装记录完整有效"
                  onChange={(checked) => setBorrowData({ disassemblyRecord: checked })}
                  disabled={!currentTask.requireDisassemblyRecord}
                />
              </FormItem>

              <FormItem
                label="工卡号"
                required={currentTask.requireWorkCardNumber}
                error={borrowFeedbacks.some(f => f.field === 'workCardNumber')}
                hint="便于后续追溯维修记录"
              >
                <InputField
                  value={borrowData.workCardNumber}
                  placeholder="请输入工卡号"
                  onChange={(value) => setBorrowData({ workCardNumber: value })}
                  disabled={!currentTask.requireWorkCardNumber}
                />
              </FormItem>
            </View>

            <View className={styles.feedbackSection}>
              <FeedbackList feedbacks={borrowFeedbacks} />
            </View>
          </>
        )}

        {currentStep === 'return' && (
          <>
            <View className={styles.formContainer}>
              <Text className={styles.formTitle}>归还信息登记</Text>

              <FormItem
                label="拆下件状态"
                required
                error={returnFeedbacks.some(f => f.field === 'partStatus')}
                hint="请根据实际检查结果选择"
              >
                <RadioGroup
                  value={returnData.partStatus}
                  options={statusOptions}
                  onChange={(value) => setReturnData({ partStatus: value as any })}
                />
              </FormItem>

              <FormItem
                label="待修牌状态"
                required={returnData.partStatus === 'damaged'}
                error={returnFeedbacks.some(f => f.field === 'hasRepairTag')}
                hint={returnData.partStatus === 'damaged' ? '损坏部件必须挂待修牌' : '良好状态无需挂待修牌'}
              >
                <CheckboxField
                  checked={returnData.hasRepairTag}
                  label="已挂红色待修牌"
                  onChange={(checked) => setReturnData({ hasRepairTag: checked })}
                />
              </FormItem>

              <FormItem
                label="附件齐套确认"
                required
                error={returnFeedbacks.some(f => f.field === 'accessoriesComplete')}
                hint="包括密封圈、垫片、螺栓等"
              >
                <CheckboxField
                  checked={returnData.accessoriesComplete}
                  label="确认所有附件已齐套归还"
                  onChange={(checked) => setReturnData({ accessoriesComplete: checked })}
                />
              </FormItem>

              <FormItem label="备注说明" hint="可选填写缺损或其他需要说明的情况">
                <InputField
                  value={returnData.remarks}
                  placeholder="请输入备注信息（选填）"
                  onChange={(value) => setReturnData({ remarks: value })}
                />
              </FormItem>
            </View>

            <View className={styles.feedbackSection}>
              <FeedbackList feedbacks={returnFeedbacks} />
            </View>
          </>
        )}

        {currentStep === 'result' && currentResult && (
          <View className={styles.resultContainer}>
            <View className={styles.scoreCard}>
              <Text className={styles.scoreValue}>{currentResult.totalScore}</Text>
              <Text className={styles.scoreLabel}>
                总分 {currentResult.totalScore} / {currentResult.maxScore}
              </Text>
            </View>

            <ScoreSection title="借出环节评分" items={currentResult.borrowScore} />
            <ScoreSection title="归还环节评分" items={currentResult.returnScore} />
          </View>
        )}
      </ScrollView>

      {currentStep !== 'result' && (
        <View className={styles.bottomBar}>
          {currentStep === 'return' && (
            <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handlePrevStep}>
              上一步
            </Button>
          )}
          <Button
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={currentStep === 'borrow' ? handleNextStep : handleSubmit}
          >
            {currentStep === 'borrow' ? '下一步' : '提交评分'}
          </Button>
        </View>
      )}

      {currentStep === 'result' && (
        <View className={styles.bottomBar}>
          <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={resetSimulation}>
            重新练习
          </Button>
          <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSaveResult}>
            保存成绩
          </Button>
        </View>
      )}
    </View>
  );
};

export default SimulatorPage;
