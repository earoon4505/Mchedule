import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Flame, 
  SlidersHorizontal,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, TaskItem } from '../../types';
import { 
  WEEKLY_QUESTS, 
  WEEKLY_GUILD_AND_MISC 
} from '../../data/defaultTasks';
import { playCheckSound } from '../../utils/notifications';
import { MapleIcon } from '../common/MapleIcon';

interface WeeklyTaskListProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleTask: (taskId: string, completed: boolean, count?: number) => void;
  onBatchComplete: (taskIds: string[], complete: boolean) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

export const WeeklyTaskList: React.FC<WeeklyTaskListProps> = React.memo(({
  character,
  record,
  onToggleTask,
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

  // 활성화된 주간 태스크 확인 헬퍼
  const enabledIds = character.enabledTaskIds || [];
  const isWeeklyTaskActive = (id: string) => enabledIds.includes(id);

  // 카테고리별 표준 순서(컨텐츠 설정과 100% 동일)로 필터링
  const arcaneQuests = WEEKLY_QUESTS.filter((t) => isWeeklyTaskActive(t.id));
  const guildAndMisc = WEEKLY_GUILD_AND_MISC.filter((t) => isWeeklyTaskActive(t.id));

  // 전체 활성화된 주간 태스크 목록
  const enabledWeeklyTasks: TaskItem[] = [...arcaneQuests, ...guildAndMisc];

  // 완료 개수 계산
  const completedCount = enabledWeeklyTasks.filter(
    (t) => record?.weeklyTasks?.[t.id]?.completed
  ).length;
  const totalCount = enabledWeeklyTasks.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;
  const progressRatio = totalCount > 0 ? (completedCount / totalCount) : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  const handleToggle = (taskId: string, currentCompleted: boolean) => {
    const next = !currentCompleted;
    if (next && soundEnabled) playCheckSound();
    onToggleTask(taskId, next);
  };

  // 등록된 컨텐츠가 없으면 스케줄 관리 전체에서 해당 항목은 아예 안 보이게 숨김
  if (totalCount === 0) {
    return null;
  }

  return (
    <div id="weekly-task-list">
      {/* 주간 컨텐츠 상단 요약 바 (모두 완료 시 박스 색상 변경) */}
      <div className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
        isAlertActive && !isAllCompleted
          ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
          : isAllCompleted
          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        {/* 숙제 완료 비율에 따른 왼쪽 게이지 채움 (전부 완료 전) */}
        {!isAllCompleted && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-rose-100/70 dark:bg-rose-900/30 transition-all duration-300 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            isAllCompleted
              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400'
          }`}>
            <Flame className={`w-5 h-5 ${isAllCompleted ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${
                isAllCompleted ? 'text-rose-950 dark:text-rose-200' : 'text-slate-900 dark:text-white'
              }`}>
                주간 컨텐츠
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                isAllCompleted
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}>
                {completedCount} / {totalCount}
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
                  ? 'border-rose-200 dark:border-rose-800 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-rose-600'
              }`}
              title={isCollapsed ? '목록 펼치기' : '목록 접기'}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <ChevronUp className="w-4 h-4" />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {/* 접히지 않았을 때 부드러운 모션과 함께 목록 렌더링 */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.25, delay: 0.05, ease: 'easeOut' },
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.18, ease: 'easeIn' },
              }
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pt-3.5 space-y-4"
            >
              {totalCount === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-400">
              <p className="text-xs font-semibold">설정된 주간 컨텐츠가 없습니다.</p>
              <button
                onClick={onOpenContentConfig}
                className="mt-2 text-xs font-bold text-orange-500 hover:underline"
              >
                컨텐츠 설정에서 추가하기
              </button>
            </div>
          ) : (
        <div className="space-y-4">
          {/* 1. 아케인리버 주간 컨텐츠 섹션 */}
          {arcaneQuests.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  아케인리버 주간 컨텐츠
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {arcaneQuests.map((task) => {
                  const isDone = !!record?.weeklyTasks?.[task.id]?.completed;
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggle(task.id, isDone)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
                        isDone
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-80'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <MapleIcon name={task.name} icon={task.icon} fallback="🌊" className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {task.name}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 길드 및 주간 컨텐츠 섹션 */}
          {guildAndMisc.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  길드 및 주간 컨텐츠
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {guildAndMisc.map((task) => {
                  const isDone = !!record?.weeklyTasks?.[task.id]?.completed;
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggle(task.id, isDone)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
                        isDone
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-80'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <MapleIcon name={task.name} icon={task.icon} fallback="🥋" className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {task.name}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
