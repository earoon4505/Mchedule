import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Coins, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, TaskItem } from '../../types';
import { BLACK_MAGE_BOSS, BLACK_MAGE_TASKS } from '../../data/defaultTasks';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { MapleIcon } from '../common/MapleIcon';
import { playCheckSound } from '../../utils/notifications';

interface BlackMageCardProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleBlackMage: (completed: boolean, difficultyId?: string) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

export const BlackMageCard: React.FC<BlackMageCardProps> = React.memo(({
  character,
  record,
  onToggleBlackMage,
  soundEnabled,
  collapsible = false,
  isAlertActive = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible);

  useEffect(() => {
    setIsCollapsed(collapsible);
  }, [collapsible]);

  const selectedDiffId = character.selectedBlackMageId;
  const selectedTask = selectedDiffId
    ? BLACK_MAGE_TASKS.find((d) => d.id === selectedDiffId)
    : undefined;

  // 1. 등록된 검은 마법사 목록
  const selectedBosses: TaskItem[] = selectedTask ? [selectedTask] : [];

  // 2. 등록되어 있지 않지만 인게임 처치(동기화/체크)된 미선택 처치 보스 목록
  const isCleared = !!record?.blackMage?.completed;
  const clearedDiffId = record?.blackMage?.difficulty || selectedDiffId || 'boss_hard_black_mage';

  const unselectedClearedBosses: TaskItem[] = [];
  if (isCleared) {
    if (!selectedDiffId) {
      // 캐릭터 설정에서 검은 마법사를 선택하지 않았지만 처치된 경우
      const task = BLACK_MAGE_TASKS.find((t) => t.id === clearedDiffId) || BLACK_MAGE_TASKS[0];
      unselectedClearedBosses.push(task);
    } else if (clearedDiffId !== selectedDiffId) {
      // 설정된 난이도와 다른 난이도를 처치한 경우
      const task = BLACK_MAGE_TASKS.find((t) => t.id === clearedDiffId);
      if (task) {
        unselectedClearedBosses.push(task);
      }
    }
  }

  // 3. 등록된 보스도 없고 미선택 처치 보스도 없으면 숨김
  if (selectedBosses.length === 0 && unselectedClearedBosses.length === 0) {
    return null;
  }

  const allClearedBosses = isCleared
    ? (unselectedClearedBosses.length > 0 ? unselectedClearedBosses : selectedBosses)
    : [];
  const clearedCount = allClearedBosses.length;
  const totalCount = selectedBosses.length;
  const isAllCompleted = totalCount === 0 ? (clearedCount > 0) : (clearedCount >= totalCount);

  // 획득 메소 계산
  let earnedMeso = 0;
  if (isCleared) {
    const clearedTask = BLACK_MAGE_TASKS.find((t) => t.id === clearedDiffId) || selectedTask || BLACK_MAGE_TASKS[0];
    earnedMeso = clearedTask.mesoValue || 465000000;
  }

  const formatMesoString = (val?: number) => {
    if (!val) return '0';
    if (val >= 100000000) {
      const eok = val / 100000000;
      return Number.isInteger(eok) ? `${eok}억` : `${eok.toFixed(2)}억`;
    }
    return `${(val / 10000).toLocaleString()}만`;
  };

  const earnedMesoStr = formatMesoString(earnedMeso > 0 ? earnedMeso : (selectedTask?.mesoValue || 0));

  const renderBossCard = (boss: TaskItem, isUnselectedCleared: boolean) => {
    const isDone = isUnselectedCleared
      ? true
      : (isCleared && (record?.blackMage?.difficulty ? record.blackMage.difficulty === boss.id : true));

    const handleToggle = () => {
      const next = !isDone;
      if (next && soundEnabled) playCheckSound();
      onToggleBlackMage(next, boss.id);
    };

    const cardMesoStr = formatMesoString(boss.mesoValue);
    const diffLabel = boss.difficulty === 'extreme' ? '익스트림' : '하드';

    return (
      <div
        id={`black-mage-card-${character.id}-${boss.id}`}
        key={boss.id}
        onClick={handleToggle}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
          isDone
            ? 'bg-black dark:bg-black border-red-600 dark:border-red-600 text-white ring-1 ring-red-600/30'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          {/* 다른 주간보스(WeeklyBossList)와 동일한 12x12 크기와 object-contain 스타일 */}
          <MapleIcon 
            name="검은 마법사" 
            icon="⚫" 
            fallback="💀" 
            className="w-12 h-12 rounded-xl object-contain flex-shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className={`text-xs font-bold truncate ${
                  isDone
                    ? 'line-through text-red-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                검은 마법사
              </p>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isDone
                    ? 'bg-black text-red-500 border-red-600'
                    : boss.difficulty === 'extreme'
                    ? 'bg-black text-red-500 border border-red-500 font-bold'
                    : 'bg-red-600 text-white font-bold border border-red-700'
                }`}
              >
                {diffLabel}
              </span>
              {isUnselectedCleared && (
                <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-900/60">
                  미선택
                </span>
              )}
            </div>
            {cardMesoStr && (
              <p
                className={`text-[11px] font-mono font-semibold mt-0.5 ${
                  isDone ? 'text-red-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {cardMesoStr} 메소
              </p>
            )}
          </div>
        </div>

        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
            isDone
              ? 'bg-black border-red-600 text-red-500'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-transparent'
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    );
  };

  return (
    <div id={`black-mage-section-${character.id}`}>
      {/* 검은 마법사 상단 요약 바: 클리어 시 순수 검정 배경 */}
      <div
        className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
          isAlertActive && !isAllCompleted
            ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
            : isAllCompleted
            ? 'bg-black dark:bg-black border-red-600 dark:border-red-600 ring-1 ring-red-600/50 text-white shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-3 relative z-10">
          {/* 메인화면 박스 아이콘: 검은 마법사 실루엣 선 아이콘 */}
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
              isAllCompleted
                ? 'bg-black border-red-600 text-red-500 shadow-xs'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
            }`}
          >
            <BlackMageSilhouetteIcon size={22} className="stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-bold ${
                  isAllCompleted ? 'text-red-500' : 'text-slate-900 dark:text-white'
                }`}
              >
                검은 마법사
              </h4>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                  isAllCompleted
                    ? 'bg-black text-red-500 border-red-600 ring-1 ring-red-600/30 shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                }`}
              >
                {clearedCount} / {totalCount}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <Coins className={`w-3.5 h-3.5 ${isAllCompleted ? 'text-red-500' : 'text-amber-500'}`} />
              <span>
                획득 메소:{' '}
                <strong className={`font-mono font-bold ${isAllCompleted ? 'text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {isCleared ? earnedMesoStr : '0'} 메소
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-colors shadow-xs ml-0.5 cursor-pointer ${
                isAllCompleted
                  ? 'border-red-600 bg-black text-red-400 hover:bg-zinc-900'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? '목록 펼치기' : '목록 접기'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 보스 카드 목록 (부드러운 모션 애니메이션) */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }}
            className="overflow-hidden"
          >
            <div className="pt-3.5 space-y-4">
              {/* 1. 등록된 검은 마법사 항목 */}
          {selectedBosses.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center bg-black text-red-500 border border-red-600/40">
                  <BlackMageSilhouetteIcon size={12} className="stroke-[2]" />
                </div>
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  검은 마법사
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedBosses.map((boss) => renderBossCard(boss, false))}
              </div>
            </div>
          )}

          {/* 2. 미선택 처치 보스 항목 (주간 보스, 일일 보스와 100% 동일한 구조) */}
          {unselectedClearedBosses.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  미선택 처치 보스
                </h5>
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-900/60">
                  {unselectedClearedBosses.length}마리
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {unselectedClearedBosses.map((boss) => renderBossCard(boss, true))}
              </div>
            </div>
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

