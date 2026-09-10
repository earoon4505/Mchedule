import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord, CustomTask } from '../../types';
import { playCheckSound } from '../../utils/notifications';
import { CustomTaskEditModal } from './CustomTaskEditModal';

interface CustomTaskListProps {
  character: CharacterInfo;
  record?: CharacterProgressRecord;
  onToggleCustomTask: (taskId: string, completed: boolean) => void;
  onUpdateCustomTask?: (updatedTask: CustomTask) => void;
  onOpenContentConfig: () => void;
  soundEnabled: boolean;
  collapsible?: boolean;
  isAlertActive?: boolean;
}

const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'];

export const CustomTaskList: React.FC<CustomTaskListProps> = React.memo(({
  character,
  record,
  onToggleCustomTask,
  onUpdateCustomTask,
  soundEnabled,
  collapsible = false,
  isAlertActive = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const [editingTask, setEditingTask] = useState<CustomTask | null>(null);

  useEffect(() => {
    setIsCollapsed(collapsible);
  }, [collapsible]);

  const customTasks = character.customTasks || [];
  const totalCount = customTasks.length;

  // 등록되어 있지 않으면 아예 나타나지 않음
  if (totalCount === 0) {
    return null;
  }

  const completedCount = customTasks.filter(
    (t) => !!record?.customTasks?.[t.id]?.completed
  ).length;

  const isAllCompleted = totalCount > 0 && completedCount === totalCount;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  const handleToggle = (taskId: string, currentCompleted: boolean) => {
    const next = !currentCompleted;
    if (next && soundEnabled) playCheckSound();
    onToggleCustomTask(taskId, next);
  };

  const getResetLabel = (task: CustomTask) => {
    if (task.resetType === 'none') return '수동';
    if (task.resetType === 'monthly' || task.resetDayOfMonth !== undefined) {
      return `매월 ${task.resetDayOfMonth || 1}일 ${task.resetTime || '00:00'}`;
    }
    if (task.resetType === 'daily') return `매일 ${task.resetTime || '00:00'}`;
    if (task.resetDaysOfWeek && task.resetDaysOfWeek.length > 0) {
      const days = [...task.resetDaysOfWeek].sort((a, b) => a - b).map((d) => DAYS_KOR[d]).join(', ');
      return `매주 (${days}) ${task.resetTime || '00:00'}`;
    }
    const d = task.resetDayOfWeek !== undefined ? DAYS_KOR[task.resetDayOfWeek] : '목';
    return `매주 ${d}요일 ${task.resetTime || '00:00'}`;
  };

  return (
    <div id="custom-task-section">
      {/* 커스텀 상단 요약 바 (게이지 및 완료 시: 라이트 모드 검정 테두리/어두운 회색 배경, 다크 모드 하얀 테두리/밝은 회색 배경) */}
      <div
        className={`relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs transition-all ${
          isAlertActive && !isAllCompleted
            ? 'border-2 border-red-500 ring-2 ring-red-500/50 animate-pulse bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/20'
            : isAllCompleted
            ? 'bg-zinc-200 border-black ring-1 ring-black/20 text-zinc-950 dark:bg-zinc-700 dark:border-white dark:ring-1 dark:ring-white/20 dark:text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        }`}
      >
        {/* 숙제 완료 비율에 따른 왼쪽 게이지 채움 */}
        {!isAllCompleted && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-zinc-200/80 dark:bg-zinc-800/50 transition-all duration-300 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
              isAllCompleted
                ? 'bg-black text-white border-black dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <Plus className={`w-5 h-5 stroke-[2.5] ${isAllCompleted ? 'text-white dark:text-zinc-950' : 'text-zinc-800 dark:text-zinc-200'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-bold ${
                  isAllCompleted ? 'text-zinc-950 dark:text-white' : 'text-slate-900 dark:text-white'
                }`}
              >
                커스텀
              </h4>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                  isAllCompleted
                    ? 'bg-black text-white border-black dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {completedCount} / {totalCount}
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
                  ? 'border-black bg-zinc-300 text-zinc-950 hover:bg-zinc-400 dark:border-white dark:bg-zinc-600 dark:text-white dark:hover:bg-zinc-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? '목록 펼치기' : '목록 접기'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 일일/주간 컨텐츠와 통일된 그리드 및 카드 디자인 (부드러운 모션 적용) */}
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
            <div className="pt-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {customTasks.map((task) => {
            const isDone = !!record?.customTasks?.[task.id]?.completed;
            const resetLabel = getResetLabel(task);

            return (
              <div
                key={task.id}
                id={`custom-task-item-${task.id}`}
                onClick={() => handleToggle(task.id, isDone)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none shadow-xs ${
                  isDone
                    ? 'bg-zinc-200 border-black ring-1 ring-black/20 text-zinc-950 dark:bg-zinc-700 dark:border-white dark:ring-1 dark:ring-white/20 dark:text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-xs font-bold truncate ${
                        isDone
                          ? 'line-through text-zinc-700 dark:text-zinc-300'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                        isDone
                          ? 'bg-zinc-300/90 text-zinc-900 border-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:border-zinc-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {resetLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {onUpdateCustomTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task);
                      }}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="커스텀 컨텐츠 수정"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>수정</span>
                    </button>
                  )}

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                      isDone
                        ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingTask && onUpdateCustomTask && (
        <CustomTaskEditModal
          isOpen={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={(updated) => {
            onUpdateCustomTask(updated);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
});
