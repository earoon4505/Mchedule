import React from 'react';
import { Users, Package, BarChart3 } from 'lucide-react';

export type MobileTabType = 'character' | 'common' | 'progress';

interface MobileBottomNavProps {
  activeTab: MobileTabType;
  onChangeTab: (tab: MobileTabType) => void;
  characterCount?: number;
}

/**
 * 모바일 웹 전용 하단 고정 네비게이션 바
 * 
 * [목적]
 * 1. 모바일 환경(lg 미만)에서 화면 최하단에 3개 메인 탭 제공: [캐릭터], [계정 컨텐츠], [진행 현황]
 * 2. PC 데스크톱 웹 및 데스크톱 앱(Electron)에서는 lg:hidden으로 완전히 숨겨져 100% 무영향 보존.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  characterCount = 0,
}) => {
  const tabs = [
    {
      id: 'character' as MobileTabType,
      label: '캐릭터',
      icon: Users,
      badge: characterCount > 0 ? characterCount : undefined,
    },
    {
      id: 'common' as MobileTabType,
      label: '계정 컨텐츠',
      icon: Package,
    },
    {
      id: 'progress' as MobileTabType,
      label: '진행 현황',
      icon: BarChart3,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="모바일 하단 탐색 바"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-md flex items-center justify-around h-13 px-1 pb-[env(safe-area-inset-bottom,0px)] select-none"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            id={`btn-mobile-nav-${tab.id}`}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {/* 활성 탭 상단 인디케이터 바 */}
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-orange-500 rounded-full" />
            )}

            <div className="relative flex items-center justify-center">
              <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-orange-500 text-white min-w-[14px] text-center leading-tight">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 tracking-tight leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
