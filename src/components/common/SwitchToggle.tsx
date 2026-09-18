import React from 'react';
import { motion } from 'motion/react';

export interface SwitchToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * 끊김 없는 모션(Seamless Motion)을 지원하는 고급 스위치 토글 컴포넌트
 * - motion/react의 spring 물리 모션으로 썸(Thumb) 이동 시 부드러운 가속/감속 제공
 * - 탭/클릭 시 미세한 스케일 피드백 및 트랙 배경색의 자연스러운 블렌딩
 */
export const SwitchToggle: React.FC<SwitchToggleProps> = React.memo(({
  id,
  checked,
  onChange,
  size = 'md',
  activeColor = 'bg-orange-500',
  inactiveColor = 'bg-slate-200 dark:bg-slate-700',
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  // 사이즈별 트랙 및 썸 규격 정의
  const dimensions = {
    sm: {
      track: 'w-9 h-5 p-0.5',
      thumb: 'w-4 h-4',
      checkedOffset: 16, // px
      uncheckedOffset: 0,
    },
    md: {
      track: 'w-11 h-6 p-0.5',
      thumb: 'w-5 h-5',
      checkedOffset: 20, // px
      uncheckedOffset: 0,
    },
    lg: {
      track: 'w-12 h-6.5 p-0.5',
      thumb: 'w-5.5 h-5.5',
      checkedOffset: 22, // px
      uncheckedOffset: 0,
    },
  }[size];

  return (
    <motion.button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className={`relative inline-flex items-center rounded-full transition-colors duration-300 ease-out focus:outline-hidden cursor-pointer select-none ${dimensions.track} ${
        checked ? activeColor : inactiveColor
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <motion.span
        layout
        transition={{
          type: 'spring',
          stiffness: 550,
          damping: 32,
        }}
        animate={{
          x: checked ? dimensions.checkedOffset : dimensions.uncheckedOffset,
        }}
        className={`block rounded-full bg-white shadow-xs pointer-events-none ${dimensions.thumb}`}
      />
    </motion.button>
  );
});
