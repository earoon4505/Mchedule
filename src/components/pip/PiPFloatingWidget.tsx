import React from 'react';
import { AppSettings, PipSettings } from '../../types';

interface PiPFloatingWidgetProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const PiPFloatingWidget: React.FC<PiPFloatingWidgetProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const pip: PipSettings = settings.pip || {
    enabled: false,
    opacity: 90,
    direction: 'horizontal',
    align: 'right',
    position: 'top',
    hideCompleted: false,
  };

  const handleTogglePip = () => {
    const nextEnabled = !pip.enabled;
    if ((window as any).electronAPI?.togglePiPWindow) {
      (window as any).electronAPI.togglePiPWindow();
    }
    onUpdateSettings({
      pip: {
        ...pip,
        enabled: nextEnabled,
      },
    });
  };

  return (
    <div
      id="pip-bottom-right-widget"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none"
    >
      {/* PIP 텍스트 및 토글 버튼 */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-xs border border-slate-300/60 dark:border-slate-700/60 shadow-xs transition-colors">
        <span className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300">
          PIP
        </span>

        <button
          id="btn-pip-mode-toggle"
          type="button"
          onClick={handleTogglePip}
          className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
            pip.enabled ? 'bg-orange-500' : 'bg-slate-400/60 dark:bg-slate-600'
          }`}
          title={pip.enabled ? 'PIP 끄기' : 'PIP 켜기'}
        >
          <span
            className={`block w-3 h-3 rounded-full bg-white transition-transform ${
              pip.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

