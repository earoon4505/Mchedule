import React, { useState, useEffect } from 'react';
import { Edit3, Plus, Minus, AlertCircle, Calendar, Clock, RotateCcw } from 'lucide-react';
import { CustomTask } from '../../types';

interface CustomTaskEditModalProps {
  isOpen: boolean;
  task: CustomTask | null;
  onClose: () => void;
  onUpdate: (updatedTask: CustomTask) => void;
}

const DAY_OPTIONS = [
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
  { label: '일', value: 0 },
];

export const CustomTaskEditModal: React.FC<CustomTaskEditModalProps> = ({
  isOpen,
  task,
  onClose,
  onUpdate,
}) => {
  const [title, setTitle] = useState('');
  const [autoReset, setAutoReset] = useState<boolean>(true);
  const [resetMode, setResetMode] = useState<'dayOfWeek' | 'date'>('dayOfWeek');
  const [isDaily, setIsDaily] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([4]);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(1);
  const [resetHour, setResetHour] = useState<number>(0);
  const [resetMinute, setResetMinute] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      const hasAutoReset = task.resetType !== 'none';
      setAutoReset(hasAutoReset);

      if (task.resetType === 'monthly' || task.resetDayOfMonth !== undefined) {
        setResetMode('date');
        setSelectedDayOfMonth(task.resetDayOfMonth || 1);
        setIsDaily(false);
        setSelectedDays([]);
      } else if (task.resetType === 'daily') {
        setResetMode('dayOfWeek');
        setIsDaily(true);
        setSelectedDays([]);
        setSelectedDayOfMonth(1);
      } else {
        setResetMode('dayOfWeek');
        setIsDaily(false);
        setSelectedDayOfMonth(1);
        if (task.resetDaysOfWeek && task.resetDaysOfWeek.length > 0) {
          setSelectedDays(task.resetDaysOfWeek);
        } else if (task.resetDayOfWeek !== undefined) {
          setSelectedDays([task.resetDayOfWeek]);
        } else {
          setSelectedDays([4]);
        }
      }

      if (task.resetTime) {
        const [h, m] = task.resetTime.split(':');
        setResetHour(parseInt(h, 10) || 0);
        setResetMinute(parseInt(m, 10) || 0);
      } else {
        setResetHour(0);
        setResetMinute(0);
      }
      setError(null);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleToggleDay = (dayValue: number) => {
    if (error) setError(null);
    if (isDaily) {
      setIsDaily(false);
      setSelectedDays([dayValue]);
      return;
    }

    if (selectedDays.includes(dayValue)) {
      if (selectedDays.length <= 1) {
        return; // 최소 1개 이상 유지
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      if (selectedDays.length >= 6) {
        setError('초기화 요일은 최대 6개까지 선택 가능합니다. (매일 초기화를 원하시면 "매일"을 선택하세요)');
        return;
      }
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleSelectDaily = () => {
    if (error) setError(null);
    setIsDaily(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('컨텐츠 제목을 입력해주세요.');
      return;
    }

    const timeString = `${String(resetHour).padStart(2, '0')}:${String(resetMinute).padStart(2, '0')}`;
    const sortedDays = [...selectedDays].sort((a, b) => a - b);

    if (!autoReset) {
      onUpdate({
        ...task,
        title: title.trim(),
        resetType: 'none',
        resetTime: undefined,
        resetDaysOfWeek: undefined,
        resetDayOfWeek: undefined,
        resetDayOfMonth: undefined,
      });
    } else if (resetMode === 'date') {
      onUpdate({
        ...task,
        title: title.trim(),
        resetType: 'monthly',
        resetTime: timeString,
        resetDayOfMonth: selectedDayOfMonth,
        resetDaysOfWeek: undefined,
        resetDayOfWeek: undefined,
      });
    } else {
      onUpdate({
        ...task,
        title: title.trim(),
        resetType: isDaily ? 'daily' : 'weekly',
        resetTime: timeString,
        resetDaysOfWeek: !isDaily ? sortedDays : undefined,
        resetDayOfWeek: !isDaily ? sortedDays[0] : undefined,
        resetDayOfMonth: undefined,
      });
    }

    onClose();
  };

  return (
    <div 
      id="custom-task-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="custom-task-edit-modal-panel"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">커스텀 수정</h3>
          </div>
          {/* 요구사항 8: X 버튼 제거 */}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              컨텐츠 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-custom-task-edit-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="컨텐츠 제목을 입력하세요"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
              autoFocus
            />
          </div>

          {/* 자동 초기화 토글 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">자동 초기화</span>
              </div>
              <button
                id="toggle-custom-edit-auto-reset"
                type="button"
                onClick={() => setAutoReset(!autoReset)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoReset ? 'bg-zinc-950 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full transition-transform ${
                    autoReset 
                      ? 'translate-x-6 bg-white dark:bg-zinc-950' 
                      : 'translate-x-1 bg-white'
                  }`}
                />
              </button>
            </div>

            {/* 자동 초기화 옵션 설정 영역 */}
            {autoReset && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                {/* 1. 초기화 기준 선택 (요일 또는 날짜) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">초기화 기준</span>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700/80">
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode('dayOfWeek');
                          if (error) setError(null);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          resetMode === 'dayOfWeek'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        요일 선택
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode('date');
                          if (error) setError(null);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          resetMode === 'date'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        날짜 선택
                      </button>
                    </div>
                  </div>

                  {resetMode === 'dayOfWeek' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          초기화 요일
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {isDaily ? '매일 초기화' : `최대 6개 (${selectedDays.length}/6개 선택)`}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {/* 매일 버튼 */}
                        <button
                          type="button"
                          onClick={handleSelectDaily}
                          className={`py-2 text-xs rounded-lg border transition-all cursor-pointer select-none font-bold ${
                            isDaily
                              ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          매일
                        </button>
                        {/* 개별 요일 버튼 (최대 6개 다중 선택) */}
                        {DAY_OPTIONS.map((d) => {
                          const isSelected = !isDaily && selectedDays.includes(d.value);
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => handleToggleDay(d.value)}
                              className={`py-2 text-xs rounded-lg border transition-all cursor-pointer select-none font-bold ${
                                isSelected
                                  ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          초기화 일자 (매월)
                        </span>
                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                          매월 {selectedDayOfMonth}일
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                          const isSelected = selectedDayOfMonth === dayNum;
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => setSelectedDayOfMonth(dayNum)}
                              className={`py-1.5 text-xs rounded-lg border font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {dayNum}일
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. 초기화 시간 (시, 분) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">초기화 시간</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 시간 (0 ~ 23) */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1 select-none">시</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setResetHour((prev) => Math.max(0, prev - 1))}
                          disabled={resetHour <= 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="1시간 감소"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white select-none">
                          {String(resetHour).padStart(2, '0')}시
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetHour((prev) => Math.min(23, prev + 1))}
                          disabled={resetHour >= 23}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="1시간 증가"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 분 (0 ~ 55, 5단위) */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1 select-none">분</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setResetMinute((prev) => Math.max(0, prev - 5))}
                          disabled={resetMinute <= 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="5분 감소"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white select-none">
                          {String(resetMinute).padStart(2, '0')}분
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetMinute((prev) => Math.min(55, prev + 5))}
                          disabled={resetMinute >= 55}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="5분 증가"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              id="btn-save-custom-task-edit"
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 transition-all shadow-xs cursor-pointer"
            >
              수정 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
