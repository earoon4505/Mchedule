import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Coins, 
  Crown,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, TaskItem } from '../../types';
import { DAILY_BOSSES } from '../../data/defaultTasks';
import { playCheckSound } from '../../utils/notifications';
import { MapleIcon } from '../common/MapleIcon';

interface DailyBossListProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleDailyBoss?: (bossId: string, completed: boolean) => void;
  onToggleBoss?: (bossId: string, completed: boolean) => void;
  onBatchComplete?: (bossIds: string[], complete: boolean) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

export const DailyBossList: React.FC<DailyBossListProps> = React.memo(({
  character,
  record,
  onToggleDailyBoss,
  onToggleBoss,
  onBatchComplete,
  onOpenContentConfig,
  soundEnabled,
  collapsible = false,
  isAlertActive = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible);

  useEffect(() => {
    setIsCollapsed(collapsible);
  }, [collapsible]);

  const toggleBossFn = onToggleDailyBoss || onToggleBoss || (() => {});

  // 1. 등록된 일일 보스 목록
  const selectedBosses: TaskItem[] = DAILY_BOSSES.filter((boss) =>
    (character.selectedDailyBossIds || []).includes(boss.id)
  );

  // 2. 등록되어 있지 않지만 인게임 처치(동기화/체크)된 미선택 처치 보스 목록
  const unselectedClearedBosses: TaskItem[] = DAILY_BOSSES.filter((boss) =>
    !(character.selectedDailyBossIds || []).includes(boss.id) && !!record?.dailyBosses?.[boss.id]?.completed
  );

  // 3. 등록 유무 상관없이 인게임에서 처치된 모든 일일 보스 목록
  const allClearedBosses = DAILY_BOSSES.filter(
    (boss) => !!record?.dailyBosses?.[boss.id]?.completed
  );

  const totalCount = selectedBosses.length;
  const clearedCount = allClearedBosses.length;
  const isAllCompleted = totalCount > 0 && clearedCount >= totalCount;
  const progressPercent = totalCount > 0 ? Math.round((Math.min(clearedCount, totalCount) / totalCount) * 100) : 0;

  // 오늘 획득한 일일 보스 결정석 금액 (등록된 보스 + 미선택 처치 보스 전체 합산)
  const earnedMeso = allClearedBosses.reduce((sum, b) => sum + (b.mesoValue || 0), 0);

  const handleToggle = (bossId: string, currentCompleted: boolean) => {
    const next = !currentCompleted;
    if (next && soundEnabled) playCheckSound();
    toggleBossFn(bossId, next);
  };

  // 등록된 보스도 없고 미선택 처치 보스도 없으면 숨김/안내
  if (selectedBosses.length === 0 && unselectedClearedBosses.length === 0) {
    if (collapsible) return null;
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-400">
        <p className="text-xs font-semibold">선택된 일일 보스가 없습니다.</p>
        <button
          onClick={onOpenContentConfig}
          className="mt-2 text-xs font-bold text-orange-500 hover:underline cursor-pointer"
        >
          스케줄 설정에서 추가하기
        </button>
      </div>
    );
  }

  // 보스 난이도 뱃지 한글화
  const getDifficultyLabel = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'extreme': return '익스트림';
      case 'hard': return '하드';
      case 'chaos': return '카오스';
      case 'normal': return '노말';
      case 'easy': return '이지';
      default: return diff || '';
    }
  };

  const formatMesoString = (val?: number) => {
    if (!val) return '';
    if (val >= 100000000) {
      return `${(val / 100000000).toFixed(2)}억`;
    }
    return `${(val / 10000).toLocaleString()}만`;
  };

  const renderBossCard = (boss: TaskItem, isUnselectedGroup: boolean = false) => {
    const isDone = !!record?.dailyBosses?.[boss.id]?.completed;
    const displayName = boss.name.replace(/^(이지|노말|하드|카오스|익스트림)\s*/, '');
    const mesoStr = formatMesoString(boss.mesoValue);

    return (
      <div
        key={boss.id}
        onClick={() => handleToggle(boss.id, isDone)}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
          isDone
            ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50 opacity-80'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          <MapleIcon name={displayName} icon={boss.icon} fallback="💀" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                {displayName}
              </p>
              {boss.difficulty && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  boss.difficulty === 'chaos'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    : boss.difficulty === 'hard'
                    ? 'bg-red-600 text-white font-bold border border-red-700 shadow-2xs'
                    : boss.difficulty === 'normal'
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                    : boss.difficulty === 'easy'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {getDifficultyLabel(boss.difficulty)}
                </span>
              )}
            </div>
            {mesoStr && (
              <p className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                {mesoStr} 메소
              </p>
            )}
          </div>
        </div>

        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
            isDone
              ? 'bg-sky-500 border-sky-500 text-white'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    );
  };

  return (
    <div id="daily-boss-list">
      {/* 일일 보스 상단 요약 바 (sky 계열) */}
      <div className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
        isAlertActive && !isAllCompleted
          ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
          : isAllCompleted
          ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-1 ring-sky-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        {/* 숙제 완료 비율 게이지 */}
        {!isAllCompleted && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-sky-100/70 dark:bg-sky-900/30 transition-all duration-300 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            isAllCompleted
              ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
              : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50 text-sky-600 dark:text-sky-400'
          }`}>
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${
                isAllCompleted ? 'text-sky-950 dark:text-sky-200' : 'text-slate-900 dark:text-white'
              }`}>
                일일 보스
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                isAllCompleted
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
              }`}>
                {clearedCount} / {totalCount}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <Coins className="w-3.5 h-3.5 text-sky-500" />
              <span>
                획득 메소: <strong className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {earnedMeso >= 100000000 
                    ? `${(earnedMeso / 100000000).toFixed(2)}억 메소`
                    : earnedMeso > 0 
                    ? `${(earnedMeso / 10000).toLocaleString()}만 메소`
                    : '0 메소'}
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
                  ? 'border-sky-200 dark:border-sky-800 bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-sky-600'
              }`}
              title={isCollapsed ? '목록 펼치기' : '목록 접기'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 접히지 않았을 때 부드러운 모션과 함께 목록 렌더링 */}
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
              {/* 1. 등록된 일일 보스 항목 */}
          {selectedBosses.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  일일 보스
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedBosses.map((boss) => renderBossCard(boss, false))}
              </div>
            </div>
          )}

          {/* 2. 미선택 처치 보스 항목 (주간 보스와 동일한 구조) */}
          {unselectedClearedBosses.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  미선택 처치 보스
                </h5>
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
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

