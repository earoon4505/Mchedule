import React from 'react';

interface BlackMageSilhouetteIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * 검은 마법사 실루엣 선 아이콘 (Black Mage Silhouette Line Icon)
 * - 메이플스토리 검은 마법사의 상징적인 깊은 로브 후드, 어둠의 눈/오브, 망토와 어둠의 사슬 실루엣을
 *   Lucide 스타일의 깔끔한 24x24 벡터 선(stroke)으로 형상화한 아이콘
 */
export const BlackMageSilhouetteIcon: React.FC<BlackMageSilhouetteIconProps> = ({
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 1. 로브 외곽 실루엣 (뾰족한 후드 끝과 양옆 어깨로 유려하게 떨어지는 로브 윤곽) */}
      <path d="M12 2.5 C10 4 6.5 7.5 6 12 C5.5 16 4 19 2.5 21.5 C7 20.5 17 20.5 21.5 21.5 C20 19 18.5 16 18 12 C17.5 7.5 14 4 12 2.5 Z" />

      {/* 2. 로브 후드 안쪽의 깊은 음영 라인 (깔끔하고 단순한 안면 후드 곡선) */}
      <path d="M9 12.5 C9 8.5 10.3 6.5 12 6.5 C13.7 6.5 15 8.5 15 12.5 C15 15.5 13.8 16.5 12 16.5 C10.2 16.5 9 15.5 9 12.5 Z" />
    </svg>
  );
};
