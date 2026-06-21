import React from 'react';
import { View, Text, Input, Switch } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FormItemProps {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FormItem: React.FC<FormItemProps> = ({ label, required, error, children, hint }) => {
  return (
    <View className={classnames(styles.formItem, error && styles.formItemError)}>
      <View className={styles.labelRow}>
        <Text className={styles.label}>
          {required && <Text className={styles.required}>*</Text>}
          {label}
        </Text>
      </View>
      <View className={styles.control}>
        {children}
      </View>
      {hint && <Text className={styles.hint}>{hint}</Text>}
    </View>
  );
};

interface InputFieldProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ value, placeholder, onChange, disabled }) => {
  return (
    <Input
      className={styles.input}
      value={value}
      placeholder={placeholder}
      onInput={(e) => onChange(e.detail.value)}
      disabled={disabled}
    />
  );
};

interface CheckboxFieldProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ checked, label, onChange, disabled }) => {
  return (
    <View
      className={classnames(styles.checkbox, checked && styles.checkboxChecked, disabled && styles.checkboxDisabled)}
      onClick={() => !disabled && onChange(!checked)}
    >
      <Switch
        className={styles.switch}
        checked={checked}
        onChange={(e) => onChange(e.detail.value)}
        disabled={disabled}
        color="#1E5FA8"
      />
      <Text className={styles.checkboxLabel}>{label}</Text>
    </View>
  );
};

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ value, options, onChange, disabled }) => {
  return (
    <View className={styles.radioGroup}>
      {options.map((option) => (
        <View
          key={option.value}
          className={classnames(
            styles.radioOption,
            value === option.value && styles.radioOptionActive,
            disabled && styles.radioOptionDisabled
          )}
          onClick={() => !disabled && onChange(option.value)}
        >
          <View className={styles.radioCircle}>
            {value === option.value && <View className={styles.radioCircleInner} />}
          </View>
          <View className={styles.radioContent}>
            <Text className={styles.radioLabel}>{option.label}</Text>
            {option.description && <Text className={styles.radioDesc}>{option.description}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

export default FormItem;
