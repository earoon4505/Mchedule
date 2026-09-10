import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[3px]',
    lg: 'w-10 h-10 border-4',
    xl: 'w-14 h-14 border-[5px]',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* 주황색 잘린 고리 회전 스피너 (메이플 오렌지 테마) */}
        <div
          className={`${sizeMap[size]} rounded-full border-orange-500/20 border-t-orange-500 border-r-amber-400 animate-spin`}
          style={{ animationDuration: '0.8s' }}
        />
        {/* 내부 메이플 단풍잎 엑센트 도트 */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      </div>
      {text && (
        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse tracking-tight">
          {text}
        </span>
      )}
    </div>
  );
};
