import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Calendar, 
  Sparkles,
  Compass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, TaskItem } from '../../types';
import { ARCANE_DAILY_QUESTS, GRANDIS_DAILY_QUESTS } from '../../data/defaultTasks';
import { playCheckSound } from '../../utils/notifications';
import { MapleIcon } from '../common/MapleIcon';

interface DailyTaskListProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleTask: (taskId: string, completed: boolean, count?: number) => void;
  onBatchComplete: (taskIds: string[], complete: boolean) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

export const DailyTaskList: React.FC<DailyTaskListProps> = React.memo(({
  character,
  record,
  onToggleTask,
  onOpenContentConfig,
  soundEnabled,
  collapsible = false,
  isAlertActive = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible);

  useEffect(() => {
    setIsCollapsed(collapsible);
  }, [collapsible]);

  // 활성화된 일일 태스크 목록 필터링 (몬스터파크는 계정 공통 진행 현황으로 분리)
  const enabledIds = character.enabledTaskIds || [];
  const arcaneTasks = ARCANE_DAILY_QUESTS.filter((t) => enabledIds.includes(t.id));
  const grandisTasks = GRANDIS_DAILY_QUESTS.filter((t) => enabledIds.includes(t.id));

  const allDailyTasks: TaskItem[] = [...arcaneTasks, ...grandisTasks];

  // 전체 일일 숙제 완료 상태 계산
  let completedCount = 0;
  allDailyTasks.forEach((t) => {
    if (record?.dailyTasks?.[t.id]?.completed) completedCount++;
  });

  const totalCount = allDailyTasks.length;
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
    <div id="daily-task-list">
      {/* 일일 컨텐츠 상단 요약 바 */}
      <div className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
        isAlertActive && !isAllCompleted
          ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
          : isAllCompleted
          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        {/* 숙제 완료 비율에 따른 왼쪽 게이지 채움 (전부 완료 전) */}
        {!isAllCompleted && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-amber-100/70 dark:bg-amber-900/30 transition-all duration-300 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            isAllCompleted
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400'
          }`}>
            <Calendar className={`w-5 h-5 ${isAllCompleted ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${
                isAllCompleted ? 'text-amber-950 dark:text-amber-200' : 'text-slate-900 dark:text-white'
              }`}>
                일일 컨텐츠
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                isAllCompleted
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
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
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-100/80 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-amber-600'
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
              <p className="text-xs font-semibold">선택된 일일 컨텐츠가 없습니다.</p>
              <button
                onClick={onOpenContentConfig}
                className="mt-2 text-xs font-bold text-orange-500 hover:underline"
              >
                컨텐츠 설정에서 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. 아케인리버 일일 퀘스트 섹션 */}
              {arcaneTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      아케인리버 일일 퀘스트
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {arcaneTasks.map((task) => {
                      const isDone = !!record?.dailyTasks?.[task.id]?.completed;
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggle(task.id, isDone)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
                            isDone
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 opacity-80'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
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
                                ? 'bg-amber-500 border-amber-500 text-white'
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

              {/* 2. 그란디스 일일 퀘스트 섹션 */}
              {grandisTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      그란디스 일일 퀘스트
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {grandisTasks.map((task) => {
                      const isDone = !!record?.dailyTasks?.[task.id]?.completed;
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggle(task.id, isDone)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
                            isDone
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 opacity-80'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <MapleIcon name={task.name} icon={task.icon} fallback="☀️" className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                {task.name}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                              isDone
                                ? 'bg-amber-500 border-amber-500 text-white'
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
