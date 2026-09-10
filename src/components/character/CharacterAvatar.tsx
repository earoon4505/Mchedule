import React, { useState } from 'react';
import { getCharacterAvatarUrl, DEFAULT_AVATAR_IMAGE, DEFAULT_AVATAR_FALLBACK } from '../../utils/image';

interface CharacterAvatarProps {
  imageUrl?: string | null;
  name?: string;
  className?: string;
  containerClassName?: string;
  isAllCompleted?: boolean;
  favorite?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  imageUrl,
  name = '캐릭터',
  className = '',
  containerClassName = '',
  isAllCompleted = false,
  favorite = false,
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  // 컨테이너 크기 클래스
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
    custom: '',
  }[size];

  const hasRealImage = !!imageUrl && !hasError;
  const targetSrc = hasRealImage ? getCharacterAvatarUrl(imageUrl) : DEFAULT_AVATAR_IMAGE;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 select-none pointer-events-none border transition-colors ${
        sizeClasses
      } ${
        isAllCompleted
          ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200/90 dark:border-slate-700'
      } ${containerClassName}`}
    >
      <img
        src={targetSrc}
        alt={name}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{ WebkitUserDrag: 'none', userSelect: 'none' }}
        className={
          hasRealImage
            ? `w-full h-full object-contain scale-[4.8] -translate-y-1 translate-x-0.5 transition-transform duration-200 pointer-events-none select-none ${className}`
            : `w-full h-full object-contain p-1.5 transition-transform duration-200 pointer-events-none select-none ${className}`
        }
        referrerPolicy="no-referrer"
        onError={(e) => {
          const img = e.currentTarget;
          if (hasRealImage && imageUrl && !img.src.includes(imageUrl)) {
            // 1단계: 원본 URL 직접 시도
            img.src = imageUrl;
          } else if (!hasError) {
            // 2단계: 실패 시 대체 아이콘 적용
            setHasError(true);
            img.src = DEFAULT_AVATAR_FALLBACK;
          }
        }}
      />

      {favorite && (
        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs pointer-events-none select-none">
          ★
        </div>
      )}
    </div>
  );
};
