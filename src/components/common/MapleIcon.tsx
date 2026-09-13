import React, { useState } from 'react';

interface MapleIconProps {
  name?: string;
  icon?: string;
  className?: string;
  fallback?: string;
}

// 명칭 정규화 맵
const ICON_NAME_MAP: Record<string, string> = {
  // 보스
  '자쿰': '자쿰',
  '매그너스': '매그너스',
  '힐라': '힐라',
  '카웅': '카웅',
  '파풀라투스': '파풀라투스',
  '피에르': '피에르',
  '반반': '반반',
  '블러디 퀸': '블러디 퀸',
  '블러디퀸': '블러디 퀸',
  '벨룸': '벨룸',
  '반 레온': '반 레온',
  '반레온': '반 레온',
  '혼테일': '혼테일',
  '아카이럼': '아카이럼',
  '핑크빈': '핑크빈',
  '시그너스': '시그너스',
  '스우': '스우',
  '데미안': '데미안',
  '가디언 엔젤 슬라임': '가디언 엔젤 슬라임',
  '가디언엔젤슬라임': '가디언 엔젤 슬라임',
  '루시드': '루시드',
  '윌': '윌',
  '더스크': '더스크',
  '진 힐라': '진 힐라',
  '진힐라': '진 힐라',
  '듄켈': '듄켈',
  '선택받은 세렌': '선택받은 세렌',
  '선택받은세렌': '선택받은 세렌',
  '세렌': '선택받은 세렌',
  '감시자 칼로스': '감시자 칼로스',
  '감시자칼로스': '감시자 칼로스',
  '칼로스': '감시자 칼로스',
  '최초의 대적자': '최초의 대적자',
  '최초의대적자': '최초의 대적자',
  '대적자': '최초의 대적자',
  '카링': '카링',
  '찬란한 흉성': '찬란한 흉성',
  '찬란한흉성': '찬란한 흉성',
  '벨로나': '벨로나',
  '림보': '림보',
  '발드릭스': '발드릭스',
  '유피테르': '유피테르',
  '검은 마법사': '검은 마법사',
  '검은마법사': '검은 마법사',

  // 아케인 / 그란디스 심볼 및 일일퀘스트
  '소멸의 여로': '소멸의 여로',
  '소멸의여로': '소멸의 여로',
  '츄츄 아일랜드': '츄츄 아일랜드',
  '츄츄아일랜드': '츄츄 아일랜드',
  '레헬른': '레헬른',
  '아르카나': '아르카나',
  '모라스': '모라스',
  '에스페라': '에스페라',
  '문 브릿지': '문 브릿지',
  '문브릿지': '문 브릿지',
  '고통의 미궁': '고통의 미궁',
  '고통의미궁': '고통의 미궁',
  '리멘': '리멘',
  '세르니움': '세르니움',
  '아르크스': '아르크스',
  '호텔 아르크스': '아르크스',
  '호텔아르크스': '아르크스',
  '오디움': '오디움',
  '도원경': '도원경',
  '아르테리아': '아르테리아',
  '카르시온': '카르시온',
  '탈라하트': '탈라하트',
  '기어드락': '기어드락',

  // 몬스터파크
  '몬스터파크': '몬스터파크',
  '몬스터 파크': '몬스터파크',
  '몬스터파크 익스트림': '몬스터파크 익스트림',
  '몬스터파크익스트림': '몬스터파크 익스트림',
  '몬스터 파크 익스트림': '몬스터파크 익스트림',

  // 에픽던전
  '하이마운틴': '하이마운틴',
  '하이 마운틴': '하이마운틴',
  '에픽 던전 : 하이 마운틴': '하이마운틴',
  '에픽던전 : 하이 마운틴': '하이마운틴',
  '앵글러 컴퍼니': '앵글러 컴퍼니',
  '앵글러컴퍼니': '앵글러 컴퍼니',
  '에픽 던전 : 앵글러 컴퍼니': '앵글러 컴퍼니',
  '에픽던전 : 앵글러 컴퍼니': '앵글러 컴퍼니',
  '악몽 선경': '악몽 선경',
  '악몽선경': '악몽 선경',
  '에픽 던전 : 악몽 선경': '악몽 선경',
  '에픽던전 : 악몽 선경': '악몽 선경',
  '아우룸 레기스': '아우룸 레기스',
  '아우룸레기스': '아우룸 레기스',
  '에픽 던전 : 아우룸 레기스': '아우룸 레기스',
  '에픽던전 : 아우룸 레기스': '아우룸 레기스',

  // 길드 및 기타
  '샤레니안의 지하 수로': '샤레니안의 지하 수로',
  '샤레니안의지하수로': '샤레니안의 지하 수로',
  '샤레니안': '샤레니안의 지하 수로',
  '플래그 레이스': '플래그 레이스',
  '플래그레이스': '플래그 레이스',
  '플래그': '플래그 레이스',
  '무릉도장': '무릉도장',
  '무릉': '무릉도장',
};

// 태스크 ID -> 아이콘 파일명 맵
const TASK_ID_MAP: Record<string, string> = {
  // 일일 퀘스트
  'daily_arcane_vanishing': '소멸의 여로',
  'daily_arcane_chuchu': '츄츄 아일랜드',
  'daily_arcane_lachelein': '레헬른',
  'daily_arcane_arcana': '아르카나',
  'daily_arcane_morass': '모라스',
  'daily_arcane_espera': '에스페라',
  'daily_arcane_moonbridge': '문 브릿지',
  'daily_arcane_labyrinth': '고통의 미궁',
  'daily_arcane_limen': '리멘',
  'daily_grandis_cernium': '세르니움',
  'daily_grandis_arcus': '아르크스',
  'daily_grandis_odium': '오디움',
  'daily_grandis_dowonkyung': '도원경',
  'daily_grandis_arteria': '아르테리아',
  'daily_grandis_carcion': '카르시온',
  'daily_grandis_tallahart': '탈라하트',
  'daily_grandis_geardrock': '기어드락',

  // 몬스터파크
  'daily_monster_park': '몬스터파크',
  'daily_monster_park_extreme': '몬스터파크 익스트림',

  // 주간 퀘스트
  'weekly_arcane_vanishing': '소멸의 여로',
  'weekly_arcane_chuchu': '츄츄 아일랜드',
  'weekly_arcane_lachelein': '레헬른',
  'weekly_arcane_arcana': '아르카나',
  'weekly_arcane_morass': '모라스',
  'weekly_arcane_espera': '에스페라',

  // 에픽던전
  'weekly_epic_high_mountain': '하이마운틴',
  'weekly_epic_angler_company': '앵글러 컴퍼니',
  'weekly_epic_nightmare_fairyland': '악몽 선경',
  'weekly_epic_aurum_regis': '아우룸 레기스',

  // 길드 & 기타
  'weekly_sharenian_culvert': '샤레니안의 지하 수로',
  'weekly_flag_race': '플래그 레이스',
  'weekly_mulung_dojang': '무릉도장',

  // 주간 보스 ID 매핑
  'boss_chaos_zakum': '자쿰',
  'boss_hard_magnus': '매그너스',
  'boss_easy_cygnus': '시그너스',
  'boss_normal_cygnus': '시그너스',
  'boss_chaos_papulatus': '파풀라투스',
  'boss_chaos_pierre': '피에르',
  'boss_chaos_vonbon': '반반',
  'boss_chaos_queen': '블러디 퀸',
  'boss_chaos_vellum': '벨룸',
  'boss_normal_swoo': '스우',
  'boss_hard_swoo': '스우',
  'boss_extreme_swoo': '스우',
  'boss_normal_demian': '데미안',
  'boss_hard_demian': '데미안',
  'boss_normal_slime': '가디언 엔젤 슬라임',
  'boss_chaos_slime': '가디언 엔젤 슬라임',
  'boss_easy_lucid': '루시드',
  'boss_normal_lucid': '루시드',
  'boss_hard_lucid': '루시드',
  'boss_easy_will': '윌',
  'boss_normal_will': '윌',
  'boss_hard_will': '윌',
  'boss_normal_dusk': '더스크',
  'boss_chaos_dusk': '더스크',
  'boss_normal_jinhilla': '진 힐라',
  'boss_hard_jinhilla': '진 힐라',
  'boss_normal_dunkel': '듄켈',
  'boss_hard_dunkel': '듄켈',
  'boss_normal_seren': '선택받은 세렌',
  'boss_hard_seren': '선택받은 세렌',
  'boss_extreme_seren': '선택받은 세렌',
  'boss_easy_kalos': '감시자 칼로스',
  'boss_normal_kalos': '감시자 칼로스',
  'boss_chaos_kalos': '감시자 칼로스',
  'boss_extreme_kalos': '감시자 칼로스',
  'boss_easy_adversary': '최초의 대적자',
  'boss_normal_adversary': '최초의 대적자',
  'boss_hard_adversary': '최초의 대적자',
  'boss_extreme_adversary': '최초의 대적자',
  'boss_easy_kaling': '카링',
  'boss_normal_kaling': '카링',
  'boss_hard_kaling': '카링',
  'boss_extreme_kaling': '카링',
  'boss_normal_radiant_star': '찬란한 흉성',
  'boss_hard_radiant_star': '찬란한 흉성',
  'boss_easy_bellona': '벨로나',
  'boss_normal_bellona': '벨로나',
  'boss_hard_bellona': '벨로나',
  'boss_normal_limbo': '림보',
  'boss_hard_limbo': '림보',
  'boss_normal_valdrix': '발드릭스',
  'boss_hard_valdrix': '발드릭스',
  'boss_normal_jupiter': '유피테르',
  'boss_hard_jupiter': '유피테르',
  'boss_black_mage_hard': '검은 마법사',
  'boss_black_mage_extreme': '검은 마법사',
  'black_mage': '검은 마법사',

  // 일일 보스 ID 매핑
  'daily_boss_easy_zakum': '자쿰',
  'daily_boss_normal_zakum': '자쿰',
  'daily_boss_easy_magnus': '매그너스',
  'daily_boss_normal_magnus': '매그너스',
  'daily_boss_normal_hilla': '힐라',
  'daily_boss_hard_hilla': '힐라',
  'daily_boss_normal_kawoong': '카웅',
  'daily_boss_easy_papulatus': '파풀라투스',
  'daily_boss_normal_papulatus': '파풀라투스',
  'daily_boss_normal_pierre': '피에르',
  'daily_boss_normal_vonbon': '반반',
  'daily_boss_normal_queen': '블러디 퀸',
  'daily_boss_normal_vellum': '벨룸',
  'daily_boss_easy_vanleon': '반 레온',
  'daily_boss_normal_vanleon': '반 레온',
  'daily_boss_hard_vanleon': '반 레온',
  'daily_boss_easy_horntail': '혼테일',
  'daily_boss_normal_horntail': '혼테일',
  'daily_boss_chaos_horntail': '혼테일',
  'daily_boss_easy_arkarium': '아카이럼',
  'daily_boss_normal_arkarium': '아카이럼',
  'daily_boss_normal_pinkbean': '핑크빈',
  'daily_boss_chaos_pinkbean': '핑크빈',
  'daily_boss_normal_cygnus': '시그너스',
};

export const getMapleIconCandidates = (nameOrId?: string): string[] => {
  if (!nameOrId) return [];

  const baseNames: string[] = [];

  // 1. 직접 ID 매핑 확인
  if (TASK_ID_MAP[nameOrId]) {
    baseNames.push(TASK_ID_MAP[nameOrId]);
  }

  // 2. 이름 직접 매핑 확인
  if (ICON_NAME_MAP[nameOrId]) {
    baseNames.push(ICON_NAME_MAP[nameOrId]);
  }

  // 3. '진 힐라' vs '힐라' 엄격한 상호 배타적 분리 처리
  // 진 힐라와 힐라는 서로 완전히 다른 보스이므로 절대 교차 매핑되어서는 안 됨
  const isJinHilla = 
    nameOrId.includes('진 힐라') || 
    nameOrId.includes('진힐라') || 
    nameOrId.toLowerCase().includes('jinhilla');

  const isPlainHilla = 
    !isJinHilla && 
    (nameOrId === '힐라' || 
     nameOrId.includes('노말 힐라') || 
     nameOrId.includes('하드 힐라') || 
     nameOrId === 'daily_boss_normal_hilla' || 
     nameOrId === 'daily_boss_hard_hilla' ||
     (nameOrId.includes('힐라') && !nameOrId.includes('진')));

  if (isJinHilla) {
    baseNames.push('진 힐라', '진힐라');
  } else if (isPlainHilla) {
    baseNames.push('힐라');
  } else {
    // 4. 이름 부분 일치 검색
    const cleanName = nameOrId
      .replace(/^(이지|노말|하드|카오스|익스트림)\s*/, '')
      .replace(/\s*(일일|주간)?\s*퀘스트.*$/, '')
      .replace(/^에픽\s*던전\s*:\s*/, '')
      .trim();

    if (ICON_NAME_MAP[cleanName]) {
      baseNames.push(ICON_NAME_MAP[cleanName]);
    }

    // 부분 매칭 시 긴 키 우선 정렬 (예: '진 힐라'가 '힐라'보다 먼저 검사)
    const sortedKeys = Object.keys(ICON_NAME_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (key.includes('힐라')) continue; // 힐라 계열은 위에서 이미 완전히 격리 처리함

      if (nameOrId.includes(key)) {
        baseNames.push(ICON_NAME_MAP[key]);
        break;
      }
    }

    if (cleanName && !baseNames.includes(cleanName)) {
      baseNames.push(cleanName);
    }
  }

  // 5. 최종 방어 필터링: 진 힐라에는 절대 '힐라'가 섞이지 않고, 힐라에는 절대 '진 힐라'가 섞이지 않음
  let filteredBases = baseNames;
  if (isJinHilla) {
    filteredBases = baseNames.filter((b) => b !== '힐라');
  } else if (isPlainHilla) {
    filteredBases = baseNames.filter((b) => b !== '진 힐라' && b !== '진힐라');
  }

  // 중복 제거
  const uniqueBases = Array.from(new Set(filteredBases));
  const candidates: string[] = [];

  for (const base of uniqueBases) {
    const encoded = encodeURIComponent(base);
    const compactEncoded = encodeURIComponent(base.replace(/\s+/g, ''));

    // 1. PNG (메이플 원본 아이콘)
    candidates.push(`/icons/${encoded}.png`);
    if (compactEncoded !== encoded) {
      candidates.push(`/icons/${compactEncoded}.png`);
    }

    // 2. WebP (수로, 플래그 등 원본 이미지)
    candidates.push(`/icons/${encoded}.webp`);
    if (compactEncoded !== encoded) {
      candidates.push(`/icons/${compactEncoded}.webp`);
    }
  }

  return Array.from(new Set(candidates));
};

export const getMapleIconSrc = (nameOrId?: string): string | null => {
  const candidates = getMapleIconCandidates(nameOrId);
  return candidates.length > 0 ? candidates[0] : null;
};

export const MapleIcon: React.FC<MapleIconProps> = ({
  name,
  icon,
  className = 'w-7 h-7 rounded-lg object-contain flex-shrink-0 shadow-xs',
  fallback,
}) => {
  const candidates = React.useMemo(() => getMapleIconCandidates(name || icon), [name, icon]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  // name이나 icon이 바뀌면 인덱스 리셋
  React.useEffect(() => {
    setCandidateIndex(0);
  }, [name, icon]);

  if (candidates.length === 0 || candidateIndex >= candidates.length) {
    return (
      <span className="text-xl flex-shrink-0 inline-flex items-center justify-center">
        {fallback || icon || '⚔️'}
      </span>
    );
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={name || 'icon'}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{ WebkitUserDrag: 'none', userSelect: 'none' }}
      referrerPolicy="no-referrer"
      onError={() => {
        setCandidateIndex((prev) => prev + 1);
      }}
      className={`select-none pointer-events-none ${className}`}
      loading="lazy"
    />
  );
};

