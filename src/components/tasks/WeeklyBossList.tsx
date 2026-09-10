import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Coins, 
  SlidersHorizontal,
  Flame,
  Crown,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, TaskItem } from '../../types';
import { WEEKLY_BOSSES } from '../../data/defaultTasks';
import { playCheckSound } from '../../utils/notifications';
import { MapleIcon } from '../common/MapleIcon';

interface WeeklyBossListProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleBoss: (bossId: string, completed: boolean) => void;
  onBatchComplete: (bossIds: string[], complete: boolean) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

export const WeeklyBossList: React.FC<WeeklyBossListProps> = React.memo(({
  character,
  record,
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

  // 1. 등록된 주간 보스 목록
  const selectedBosses: TaskItem[] = WEEKLY_BOSSES.filter((boss) =>
    (character.selectedBossIds || []).includes(boss.id)
  );

  // 2. 등록되어 있지 않지만 인게임 처치(동기화/체크)된 미선택 처치 보스 목록
  const unselectedClearedBosses: TaskItem[] = WEEKLY_BOSSES.filter((boss) =>
    !(character.selectedBossIds || []).includes(boss.id) && !!record?.weeklyBosses?.[boss.id]?.completed
  );

  // 3. 등록 유무 상관없이 인게임에서 처치된 모든 주간 보스 목록
  const allClearedBosses = WEEKLY_BOSSES.filter(
    (boss) => !!record?.weeklyBosses?.[boss.id]?.completed
  );

  const clearedCount = allClearedBosses.length;
  const selectedBossCount = (character.selectedBossIds || []).length;
  const threshold = selectedBossCount === 0 ? 0 : (character.weeklyBossThreshold ?? Math.min(12, selectedBossCount));
  const isAllCompleted = threshold === 0 ? true : clearedCount >= threshold;
  const progressRatio = threshold > 0 ? Math.min(1, clearedCount / threshold) : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  // 메소 계산
  let earnedMeso = allClearedBosses.reduce((sum, b) => sum + (b.mesoValue || 0), 0);

  const handleToggle = (bossId: string, currentCompleted: boolean) => {
    const next = !currentCompleted;
    if (next && soundEnabled) playCheckSound();
    onToggleBoss(bossId, next);
  };

  // 등록된 컨텐츠가 없으면 스케줄 관리 전체에서 해당 항목은 아예 안 보이게 숨김
  if (selectedBosses.length === 0 && unselectedClearedBosses.length === 0) {
    return null;
  }

  // 보스 난이도 뱃지 한글화 맵
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

  const renderBossCard = (boss: TaskItem, isUnselectedGroup: boolean = false) => {
    const isDone = !!record?.weeklyBosses?.[boss.id]?.completed;
    const mesoStr = boss.mesoValue ? `${(boss.mesoValue / 100000000).toFixed(2)}억` : '';
    const displayName = boss.name.replace(/^(이지|노말|하드|카오스|익스트림)\s*/, '');

    return (
      <div
        key={boss.id}
        onClick={() => handleToggle(boss.id, isDone)}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
          isDone
            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 opacity-80'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
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
                  boss.difficulty === 'extreme'
                    ? 'bg-black text-red-500 border border-red-500 font-bold'
                    : boss.difficulty === 'chaos'
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
              <p className="text-[11px] font-mono text-purple-700 dark:text-purple-400 font-semibold mt-0.5">
                {mesoStr} 메소
              </p>
            )}
          </div>
        </div>

        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
            isDone
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    );
  };

  return (
    <div id="weekly-boss-list">
      {/* 주간 보스 상단 요약 바 (완료 기준 충족 시 박스 색상 변경) */}
      <div className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
        isAlertActive && !isAllCompleted
          ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
          : isAllCompleted
          ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        {/* 숙제 완료 비율에 따른 왼쪽 게이지 채움 (전부 완료 전) */}
        {!isAllCompleted && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-purple-100/70 dark:bg-purple-900/30 transition-all duration-300 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            isAllCompleted
              ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400'
          }`}>
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${
                isAllCompleted ? 'text-purple-950 dark:text-purple-200' : 'text-slate-900 dark:text-white'
              }`}>
                주간 보스
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                isAllCompleted
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
              }`}>
                {clearedCount} / {threshold}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <Coins className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>
                획득 메소: <strong className="font-mono font-bold text-purple-700 dark:text-purple-300">{(earnedMeso / 100000000).toFixed(2)}억 메소</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-colors shadow-xs ml-0.5 ${
                isAllCompleted
                  ? 'border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-purple-700'
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
              {selectedBosses.length === 0 && unselectedClearedBosses.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-400">
              <p className="text-xs font-semibold">선택된 주간 보스가 없습니다.</p>
              <button
                onClick={onOpenContentConfig}
                className="mt-2 text-xs font-bold text-orange-500 hover:underline"
              >
                컨텐츠 설정에서 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. 등록된 주간 보스 항목 */}
              {selectedBosses.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-700 dark:text-purple-400 flex-shrink-0" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      주간 보스
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {selectedBosses.map((boss) => renderBossCard(boss, false))}
                  </div>
                </div>
              )}

              {/* 2. 미선택 처치 보스 항목 */}
              {unselectedClearedBosses.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-700 dark:text-purple-400 flex-shrink-0" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      미선택 처치 보스
                    </h5>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                      {unselectedClearedBosses.length}마리
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {unselectedClearedBosses.map((boss) => renderBossCard(boss, true))}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
