import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AccountIndicatorItem {
  id: string;
  alias: string;
  isActive: boolean;
  firstCharId?: string;
  charCount: number;
}

interface AccountIndicatorBarProps {
  accounts: AccountIndicatorItem[];
  /** 프로필 사진만 표시 모드일 경우: 현재 계정 별칭만 단독 노출 */
  onlyCurrentAlias?: boolean;
  onSelectAccount?: (firstCharId: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * PiP 계정 인디케이터 컴포넌트 (Seamless Motion 고도화)
 * - 복수 계정 등록 시 계정별 인디케이터 표시
 * - 비활성 계정: 작은 동그라미 점 (w-2.5 h-2.5) -> 호버/클릭 시 탄력적인 스프링 피드백
 * - 활성 계정: 좌우로 부드럽게 늘어나는 필(Pill)형 태그 (motion layout 스프링 전환, 별칭 표시, 투명 배경)
 * - 프로필 사진만 표시 모드: 현재 계정 별칭만 깔끔하게 노출
 * - 점 클릭 시 해당 계정의 첫 번째 캐릭터로 즉시 전환
 */
export const AccountIndicatorBar: React.FC<AccountIndicatorBarProps> = React.memo(({
  accounts,
  onlyCurrentAlias = false,
  onSelectAccount,
  onMouseDown,
  className = '',
}) => {
  // 복수 계정(2개 이상)일 때만 인디케이터 렌더링
  if (!accounts || accounts.length < 2) {
    return null;
  }

  // 현재 활성화된 계정 찾기 (없으면 첫 번째 계정)
  const activeAccount = accounts.find((acc) => acc.isActive) || accounts[0];

  // 프로필 사진만 표시일 때는 컴팩트한 인디케이터 (현재 계정 필 + 비활성 계정 점 + 원클릭 순환 전환)
  if (onlyCurrentAlias) {
    const currentIndex = accounts.findIndex((acc) => acc.id === activeAccount.id);
    const nextAccount = accounts[(currentIndex + 1) % accounts.length];

    const handleCycleAccount = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nextAccount?.firstCharId && onSelectAccount) {
        onSelectAccount(nextAccount.firstCharId);
      }
    };

    return (
      <div
        id="pip-account-indicator-bar-alias-only"
        onMouseDown={onMouseDown}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={`inline-flex items-center p-0 bg-transparent border-0 shadow-none pointer-events-auto select-none ${className}`}
        title={`현재 계정: ${activeAccount.alias} (클릭하여 다음 계정 [${nextAccount.alias}]으로 전환)`}
      >
        {/* 활성화된 계정 필 단독 표시 (클릭 시 다음 계정으로 순환 전환) */}
        <motion.button
          type="button"
          key={activeAccount.id}
          id={`pip-account-pill-${activeAccount.id}`}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={handleCycleAccount}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="h-5 px-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] tracking-tight flex items-center shadow-xs select-none cursor-pointer focus:outline-hidden"
        >
          <motion.span
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="truncate max-w-[85px]"
          >
            {activeAccount.alias}
          </motion.span>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      id="pip-account-indicator-bar"
      layout
      onMouseDown={onMouseDown}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={`inline-flex items-center gap-1.5 p-0 bg-transparent border-0 shadow-none pointer-events-auto select-none ${className}`}
      title="등록된 계정 목록 (클릭하여 해당 계정 캐릭터로 전환)"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {accounts.map((acc, index) => {
          const isCurrentActive = acc.isActive;

          if (isCurrentActive) {
            // 활성화된 계정: 좌우로 부드럽게 늘어난 필(Pill) 형태 + 별칭 텍스트 (스프링 물리 모션)
            return (
              <motion.div
                key={acc.id || `acc-${index}`}
                id={`pip-account-pill-${acc.id}`}
                layout
                layoutId={`pip-account-active-item`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 480,
                  damping: 30,
                  mass: 0.8,
                }}
                className="h-5 px-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] tracking-tight flex items-center shadow-xs select-none cursor-default flex-shrink-0"
              >
                <motion.span
                  layout="position"
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.22, delay: 0.05 }}
                  className="truncate max-w-[85px]"
                >
                  {acc.alias || `계정 ${index + 1}`}
                </motion.span>
              </motion.div>
            );
          }

          // 비활성화된 계정: 작은 동그라미 점
          return (
            <motion.button
              key={acc.id || `acc-${index}`}
              type="button"
              id={`pip-account-dot-${acc.id}`}
              layout
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                if (acc.firstCharId && onSelectAccount) {
                  onSelectAccount(acc.firstCharId);
                }
              }}
              whileHover={{ scale: 1.35 }}
              whileTap={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              title={`[${acc.alias || `계정 ${index + 1}`}] 계정으로 전환 (${acc.charCount}개 캐릭터)`}
              className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-orange-400 dark:hover:bg-orange-400 transition-colors duration-200 cursor-pointer flex-shrink-0 focus:outline-hidden"
              aria-label={acc.alias || `계정 ${index + 1}`}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
});
