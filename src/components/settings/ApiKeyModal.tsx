import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Sparkles,
  Edit2,
  Plus,
  RefreshCw,
  BookOpen,
  List,
  X
} from 'lucide-react';
import { 
  fetchApiKeys, 
  addApiKey, 
  updateApiKey,
  removeApiKey, 
  getApiKeyInfo,
  testApiKey
} from '../../services/api';
import { ApiKeyItem } from '../../types';
import { broadcastApiKeys } from '../../utils/syncChannel';
import { ApiGuideModal } from '../common/ApiGuideModal';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: (hasKey: boolean, updatedKeys?: ApiKeyItem[]) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  // 탭 상태: 'register'(API 등록, 기본값) | 'list'(API 목록)
  const [activeTab, setActiveTab] = useState<'register' | 'list'>('register');

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // 개별 키 수정 모드
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState('');
  const [editingApiKey, setEditingApiKey] = useState('');
  const [showEditingPassword, setShowEditingPassword] = useState(false);
  
  // 개별 키 마스킹 토글 상태 (기본: 마스킹 처리로 화면공유/방송 보호)
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());

  const toggleRevealKey = (id: string) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 실시간 넥슨 API 키 규격 검사 헬퍼
  const checkKeyFormat = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith('live_') && !trimmed.startsWith('test_')) {
      return {
        isValid: false,
        message: "넥슨 API 키는 일반적으로 'live_'로 시작합니다. 복사한 키를 확인해주세요.",
      };
    }
    if (trimmed.length < 30) {
      return {
        isValid: false,
        message: 'API 키 길이가 짧습니다. 키 전체가 온전히 복사되었는지 확인해주세요.',
      };
    }
    return {
      isValid: true,
      message: '넥슨 Open API 규격(live_...)과 일치합니다.',
    };
  };
  
  // 개별 키 삭제 확인 상태
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // 각 API 키의 실시간 연결 상태 ('checking' | 'valid' | 'invalid')
  const [keyStatuses, setKeyStatuses] = useState<Record<string, 'checking' | 'valid' | 'invalid'>>({});

  // 모든 등록된 API 키의 실시간 연결 상태 검증
  const checkAllKeyStatuses = async (targetKeys: ApiKeyItem[]) => {
    if (!targetKeys || targetKeys.length === 0) return;

    setKeyStatuses((prev) => {
      const next = { ...prev };
      targetKeys.forEach((k) => {
        next[k.id] = 'checking';
      });
      return next;
    });

    await Promise.all(
      targetKeys.map(async (k) => {
        try {
          const res = await testApiKey(k.apiKey);
          setKeyStatuses((prev) => ({
            ...prev,
            [k.id]: res.success ? 'valid' : 'invalid',
          }));
        } catch {
          setKeyStatuses((prev) => ({
            ...prev,
            [k.id]: 'invalid',
          }));
        }
      })
    );
  };

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 모달 열릴 때 최신 API 키 목록 불러오기
  const loadKeys = async () => {
    setIsLoading(true);
    setMessage(null);
    setEditingKeyId(null);
    setDeletingKeyId(null);
    try {
      const res = await fetchApiKeys();
      if (res.success && res.keys) {
        setKeys(res.keys);
        broadcastApiKeys(res.keys);
        onKeyUpdated(res.keys.length > 0, res.keys);
        checkAllKeyStatuses(res.keys);
      } else {
        const info = await getApiKeyInfo();
        if (info.keys && info.keys.length > 0) {
          setKeys(info.keys);
          broadcastApiKeys(info.keys);
          onKeyUpdated(true, info.keys);
          checkAllKeyStatuses(info.keys);
        } else {
          setKeys([]);
          onKeyUpdated(info.hasApiKey, []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setAliasInput('');
      setApiKeyInput('');
      setActiveTab('register'); // 기본값: API 등록 탭
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. 신규 API 키 등록 (사전 유효성 검증 및 중복 체크)
  const handleAddKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedKey = apiKeyInput.trim();
    const trimmedAlias = aliasInput.trim();

    if (!trimmedKey) {
      setMessage({ type: 'error', text: '등록할 API 키를 입력해주세요.' });
      return;
    }

    // [중복 검사 가드]
    if (keys.some((k) => k.apiKey === trimmedKey)) {
      setMessage({ type: 'error', text: '이미 등록되어 있는 API 키입니다.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // [사전 유효성 검증 가드] 넥슨 Open API에 먼저 연결 테스트 수행
    const testRes = await testApiKey(trimmedKey);
    if (!testRes.success) {
      setIsLoading(false);
      const errorDetail = testRes.error === 'The apikey is not valid.'
        ? '넥슨에 등록되지 않았거나 오타가 있는 API 키입니다. 키 발급 상태를 확인해주세요.'
        : (testRes.error || '유효하지 않은 API 키입니다.');
      setMessage({
        type: 'error',
        text: `[API 키 검증 실패] ${errorDetail}`,
      });
      return;
    }

    // 검증 성공 후 안전하게 저장
    const res = await addApiKey(trimmedKey, trimmedAlias || undefined);
    setIsLoading(false);

    if (res.success && res.keys) {
      setKeys(res.keys);
      broadcastApiKeys(res.keys);
      setAliasInput('');
      setApiKeyInput('');
      setMessage({ 
        type: 'success', 
        text: res.message || 'API 키가 성공적으로 등록되었습니다!' 
      });
      onKeyUpdated(res.keys.length > 0, res.keys);
      checkAllKeyStatuses(res.keys);
      // 등록 성공 시 목록 탭으로 자동 이동하여 등록된 키를 바로 확인 가능하게 함
      setActiveTab('list');
    } else {
      setMessage({ type: 'error', text: res.error || 'API 키 등록에 실패했습니다.' });
    }
  };

  // 2. API 키 정보(별칭 및 API 키) 수정 시작
  const handleStartEdit = (keyItem: ApiKeyItem) => {
    setEditingKeyId(keyItem.id);
    setEditingAlias(keyItem.alias);
    setEditingApiKey(keyItem.apiKey);
    setShowEditingPassword(false);
    setDeletingKeyId(null);
    setMessage(null);
  };

  // 2-1. API 키 정보 수정 저장 (사전 유효성 검증 및 기존 데이터 보호 가드)
  const handleSaveEdit = async (item: ApiKeyItem) => {
    const trimmedAlias = editingAlias.trim();
    const trimmedKey = editingApiKey.trim();

    if (!trimmedAlias) {
      setMessage({ type: 'error', text: '계정 별칭을 입력해주세요.' });
      return;
    }
    if (!trimmedKey) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }

    // 변경 사항이 없는 경우 편집 종료
    if (trimmedAlias === item.alias && trimmedKey === item.apiKey) {
      setEditingKeyId(null);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // [3중 안전장치] API 키 값이 변경된 경우: 넥슨 Open API에 사전 연결 테스트 수행
    if (trimmedKey !== item.apiKey) {
      const testRes = await testApiKey(trimmedKey);
      if (!testRes.success) {
        setIsLoading(false);
        const errorDetail = testRes.error === 'The apikey is not valid.'
          ? '넥슨에 등록되지 않았거나 오타가 있는 API 키입니다.'
          : (testRes.error || '유효하지 않은 API 키입니다.');
        setMessage({
          type: 'error',
          text: `[API 키 검증 실패] ${errorDetail} (기존 API 키와 연동 캐릭터는 안전하게 보존되었습니다.)`,
        });
        return;
      }
    }

    const res = await updateApiKey(item.id, {
      alias: trimmedAlias,
      apiKey: trimmedKey !== item.apiKey ? trimmedKey : undefined,
    });
    setIsLoading(false);

    if (res.success && res.keys) {
      setKeys(res.keys);
      broadcastApiKeys(res.keys);
      setEditingKeyId(null);
      setMessage({
        type: 'success',
        text: trimmedKey !== item.apiKey
          ? `'${trimmedAlias}' API 키가 안전하게 갱신되었습니다.`
          : `'${trimmedAlias}' 별칭이 성공적으로 변경되었습니다.`,
      });
      onKeyUpdated(res.keys.length > 0, res.keys);
      checkAllKeyStatuses(res.keys);
    } else {
      setMessage({ type: 'error', text: res.error || 'API 키 수정에 실패했습니다.' });
    }
  };

  // 3. 특정 API 키 삭제
  const handleDeleteKey = async (id: string) => {
    setIsLoading(true);
    setMessage(null);

    const res = await removeApiKey(id);
    setIsLoading(false);
    setDeletingKeyId(null);

    if (res.success && res.keys) {
      setKeys(res.keys);
      broadcastApiKeys(res.keys);
      setMessage({ type: 'info', text: 'API 키와 연동된 캐릭터가 모두 삭제되었습니다.' });
      onKeyUpdated(res.keys.length > 0, res.keys);
    } else {
      setMessage({ type: 'error', text: res.error || 'API 키 삭제에 실패했습니다.' });
    }
  };

  // 키 복사
  const handleCopyKey = (keyText: string, keyId: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const hasAnyKey = keys.length > 0;

  return (
    <div 
      id="api-key-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg">
        {/* 모달 창 상단 외부 알림 메시지 배너 (NEXON Open API 등록 및 관리 창 위, 창 위치 고정용 절대 위치) */}
        {message && (
          <div className="absolute -top-14 left-0 right-0 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
            <div
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2.5 backdrop-blur-md ${
                message.type === 'success'
                  ? 'bg-emerald-500/95 text-white border border-emerald-400/50 shadow-emerald-950/25'
                  : message.type === 'error'
                  ? 'bg-rose-500/95 text-white border border-rose-400/50 shadow-rose-950/25'
                  : 'bg-blue-500/95 text-white border border-blue-400/50 shadow-blue-950/25'
              }`}
            >
              {message.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'info' && <Sparkles className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 truncate">{message.text}</span>
            </div>
          </div>
        )}

        <div 
          id="api-key-modal"
          className="w-full h-auto max-h-[82dvh] sm:h-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col"
        >
        {/* 모달 헤더 */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                NEXON Open API 등록 및 관리
              </h3>
            </div>
          </div>
        </div>

        {/* 상단 탭 메뉴 (API 등록, API 목록) - 기본값: API 등록 */}
        <div className="px-6 pt-3 pb-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>API 등록</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setMessage(null);
              if (keys.length > 0) {
                checkAllKeyStatuses(keys);
              }
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>API 목록</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              keys.length > 0 
                ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {keys.length}
            </span>
          </button>
        </div>

        {/* 본문 영역 (모바일 및 데스크톱 스크롤 완벽 지원: flex-1 overflow-y-auto touch-pan-y min-h-0) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar touch-pan-y overscroll-contain min-h-0">

          {/* ============================== */}
          {/* 1. [API 등록] 탭 내용 (기본값) */}
          {/* ============================== */}
          {activeTab === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-150 flex flex-col justify-between min-h-full">
              {/* 신규 API 키 입력 및 등록 폼 */}
              <form onSubmit={handleAddKey} className="space-y-3.5">
                {/* API 이름 입력 */}
                <div className="space-y-1">
                  <label htmlFor="input-api-alias" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    계정 별칭 (선택)
                  </label>
                  <input
                    id="input-api-alias"
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="예: 본계정, 부계정"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* API 키 입력 */}
                <div className="space-y-1">
                  <label htmlFor="input-api-key" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    API 키
                  </label>
                  <div className="relative">
                    <input
                      id="input-api-key"
                      type={showPassword ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value.trim())}
                      placeholder="live_..."
                      className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {apiKeyInput && (
                        <button
                          type="button"
                          onClick={() => setApiKeyInput('')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                          title="입력창 지우기"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                        title={showPassword ? '키 숨기기' : '키 보기'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 실시간 규격 및 중복 검사 인디케이터 (높이 고정하여 하단 버튼 밀림 원천 방지) */}
                  <div className="h-4.5 flex items-center">
                    {(() => {
                      const trimmed = apiKeyInput.trim();
                      if (!trimmed) return null;
                      const isDuplicate = keys.some((k) => k.apiKey === trimmed);
                      if (isDuplicate) {
                        return (
                          <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in duration-100">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            이미 등록되어 있는 API 키입니다.
                          </p>
                        );
                      }
                      const format = checkKeyFormat(trimmed);
                      if (!format) return null;
                      return format.isValid ? (
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-100">
                          <Check className="w-3 h-3 flex-shrink-0" />
                          {format.message}
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-in fade-in duration-100">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {format.message}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* 등록 버튼 */}
                <div>
                  <button
                    type="submit"
                    id="btn-save-api-key"
                    disabled={isLoading || !apiKeyInput.trim() || keys.some((k) => k.apiKey === apiKeyInput.trim())}
                    className="w-full py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>API 키 검증 및 등록 중...</span>
                      </div>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>검증 후 API 등록</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 하단: 바로가기 및 가이드 열기 버튼 (감싸는 박스 제거하고 버튼 2열 배치) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* 1) 넥슨 Open API 바로가기 (새창 열기) */}
                <a
                  href="https://openapi.nexon.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: '#0077ff' }}
                  className="py-2.5 px-3 rounded-xl text-white hover:brightness-110 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <span>넥슨 Open API 바로가기</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/90" />
                </a>

                {/* 2) API 발급 방법 (가이드 팝업 열기) */}
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-white/90" />
                  <span>API 발급 방법</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================== */}
          {/* 2. [API 목록] 탭 내용 */}
          {/* ============================== */}
          {activeTab === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* 목록 렌더링 */}
              {hasAnyKey ? (
                <div className="space-y-2.5">
                  {keys.map((item, idx) => {
                    const isEditing = editingKeyId === item.id;
                    const isDeleting = deletingKeyId === item.id;
                    const isCopied = copiedKeyId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-2 transition-all"
                      >
                        {isEditing ? (
                          <div className="space-y-2 p-1 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1 border-b border-orange-200/60 dark:border-orange-900/50">
                              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <Edit2 className="w-3 h-3" />
                                API 수정
                              </span>
                            </div>

                            {/* 별칭 입력 */}
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                계정 별칭
                              </label>
                              <input
                                type="text"
                                value={editingAlias}
                                onChange={(e) => setEditingAlias(e.target.value)}
                                placeholder="예: 본계정, 부계정"
                                className="w-full px-2.5 py-1.5 text-base sm:text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(item);
                                  if (e.key === 'Escape') setEditingKeyId(null);
                                }}
                              />
                            </div>

                            {/* API 키 입력 */}
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                API Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showEditingPassword ? 'text' : 'password'}
                                  value={editingApiKey}
                                  onChange={(e) => setEditingApiKey(e.target.value.trim())}
                                  placeholder="live_..."
                                  className="w-full pl-2.5 pr-8 py-1.5 text-base sm:text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-orange-500 select-all"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(item);
                                    if (e.key === 'Escape') setEditingKeyId(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowEditingPassword(!showEditingPassword)}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                                  title={showEditingPassword ? '키 숨기기' : '키 보기'}
                                >
                                  {showEditingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* 실시간 규격 검사 인디케이터 */}
                              {(() => {
                                const format = checkKeyFormat(editingApiKey);
                                if (!format) return null;
                                return format.isValid ? (
                                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 animate-in fade-in duration-100">
                                    <Check className="w-3 h-3" />
                                    {format.message}
                                  </p>
                                ) : (
                                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5 animate-in fade-in duration-100">
                                    <AlertCircle className="w-3 h-3" />
                                    {format.message}
                                  </p>
                                );
                              })()}
                            </div>

                            {/* 버튼 그룹 */}
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingKeyId(null)}
                                disabled={isLoading}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(item)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                {isLoading ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    검증 및 저장 중...
                                  </>
                                ) : (
                                  '검증 후 저장'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black truncate max-w-[150px]">
                                  {item.alias || `API ${idx + 1}`}
                                </span>

                                {/* 실시간 넥슨 Open API 연결 상태 뱃지 */}
                                {keyStatuses[item.id] === 'checking' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 animate-pulse">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-400" />
                                    <span>연결 확인 중...</span>
                                  </span>
                                )}
                                {keyStatuses[item.id] === 'valid' && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60"
                                    title="넥슨 Open API 서버와 정상 통신 중"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>연결 정상</span>
                                  </span>
                                )}
                                {keyStatuses[item.id] === 'invalid' && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/60"
                                    title="API 키가 만료되었거나 올바르지 않습니다"
                                  >
                                    <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                    <span>연결 실패 (키 만료됨)</span>
                                  </span>
                                )}
                              </div>

                              {/* 우측 수정 / 삭제 버튼 */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isDeleting ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingKeyId(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
                                    title="삭제 취소"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1.5 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="API 키 및 별칭 수정"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingKeyId(item.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="API 키 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 삭제 확인 전용 알림 바 (모바일에서 폰트 깨짐/뒤섞임 없이 반듯하게 정렬) */}
                            {isDeleting && (
                              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                  <span className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 leading-snug">
                                    연동된 캐릭터도 함께 삭제됩니다. 계속할까요?
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKey(item.id)}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-lg cursor-pointer transition-all shadow-xs"
                                  >
                                    {isLoading ? '삭제 중...' : '삭제 확인'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingKeyId(null)}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 rounded-lg cursor-pointer transition-all"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 보안 마스킹 토글 및 실제 API 키 텍스트 및 복사 버튼 */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <code className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 truncate select-all flex-1">
                                {revealedKeyIds.has(item.id)
                                  ? item.apiKey
                                  : (item.apiKey.length > 14
                                      ? `${item.apiKey.slice(0, 5)}••••••••••••••••${item.apiKey.slice(-4)}`
                                      : '••••••••••••••••')}
                              </code>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleRevealKey(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
                                  title={revealedKeyIds.has(item.id) ? 'API 키 숨기기' : 'API 키 전체 보기'}
                                >
                                  {revealedKeyIds.has(item.id) ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(item.apiKey, item.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
                                  title="전체 API 키 복사"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      등록된 API 키가 없습니다.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      상단의 'API 등록' 탭에서 새 API 키를 등록해주세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>API 등록하러 가기</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
      </div>

      {/* API 발급 방법 안내 슬라이더 모달 */}
      <ApiGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
