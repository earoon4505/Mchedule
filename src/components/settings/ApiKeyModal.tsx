import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  RefreshCw
} from 'lucide-react';
import { 
  fetchApiKeys, 
  addApiKey, 
  updateApiKey,
  updateApiKeyAlias, 
  removeApiKey, 
  getApiKeyInfo,
  testApiKey
} from '../../services/api';
import { ApiKeyItem } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { broadcastApiKeys } from '../../utils/syncChannel';

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
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
      } else {
        const info = await getApiKeyInfo();
        if (info.keys && info.keys.length > 0) {
          setKeys(info.keys);
          broadcastApiKeys(info.keys);
          onKeyUpdated(true, info.keys);
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
        ? '넥슨에 등록되지 않았거나 오타가 있는 API 키입니다.'
        : (testRes.error || '유효하지 않은 API 키입니다.');
      setMessage({
        type: 'error',
        text: `[API 키 검증 실패] ${errorDetail}`,
      });
      return;
    }

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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        id="api-key-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
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
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 상태 알림 메시지 */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : message.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {message.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'info' && <Sparkles className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          {/* 1. 현재 등록 상태 카드 (요구사항: '(연동 활성화)' 제거 -> 'API키 등록 완료') */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                현재 API 등록 상태
              </span>
              {hasAnyKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  API키 등록 완료
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-extrabold">
                    {keys.length}개
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  API 키 미등록 (대기 중)
                </span>
              )}
            </div>

            {/* 2. 보안 마스킹은 제거하고 API 리스트를 보여준다 */}
            {hasAnyKey && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>등록된 API 목록</span>
                  <span>총 {keys.length}개 등록됨</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                  {keys.map((item, idx) => {
                    const isEditing = editingKeyId === item.id;
                    const isDeleting = deletingKeyId === item.id;
                    const isCopied = copiedKeyId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col gap-1.5 transition-all"
                      >
                        {isEditing ? (
                          <div className="space-y-2 p-1 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1 border-b border-orange-200/60 dark:border-orange-900/50">
                              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <Edit2 className="w-3 h-3" />
                                API 키 및 계정 별칭 수정
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                넥슨 API 사전 검증
                              </span>
                            </div>

                            {/* 별칭 입력 */}
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                계정 별칭 (이름)
                              </label>
                              <input
                                type="text"
                                value={editingAlias}
                                onChange={(e) => setEditingAlias(e.target.value)}
                                placeholder="예: 본계정, 부계정"
                                className="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(item);
                                  if (e.key === 'Escape') setEditingKeyId(null);
                                }}
                              />
                            </div>

                            {/* API 키 입력 */}
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  NEXON Open API Key
                                </label>
                                <span className="text-[9px] text-slate-400">공백 자동제거 · 오타 시 기존 키 보호</span>
                              </div>
                              <div className="relative">
                                <input
                                  type={showEditingPassword ? 'text' : 'password'}
                                  value={editingApiKey}
                                  onChange={(e) => setEditingApiKey(e.target.value.trim())}
                                  placeholder="live_..."
                                  className="w-full pl-2.5 pr-8 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-orange-500 select-all"
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
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(item)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black truncate max-w-[140px]">
                                  {item.alias || `API ${idx + 1}`}
                                </span>
                              </div>

                              {/* 우측 수정 / 삭제 버튼 */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isDeleting ? (
                                  <div className="flex items-center gap-1 animate-in fade-in duration-100">
                                    <span className="text-[10px] font-bold text-rose-600">연동 캐릭터도 삭제됩니다. 계속할까요?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteKey(item.id)}
                                      disabled={isLoading}
                                      className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded"
                                    >
                                      확인
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingKeyId(null)}
                                      className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                      title="API 키 및 별칭 수정"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingKeyId(item.id)}
                                      className="p-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                      title="API 키 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 보안 마스킹 토글 및 실제 API 키 텍스트 및 복사 버튼 */}
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <code className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 truncate select-all flex-1">
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
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
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
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
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
              </div>
            )}
          </div>

          {/* 3. 신규 API 키 입력 및 등록 폼 */}
          <form onSubmit={handleAddKey} className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-orange-500" />
                API 키 신규 등록
              </span>
            </div>

            {/* API 이름 입력 */}
            <div className="space-y-1">
              <label htmlFor="input-api-alias" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                API 이름
              </label>
              <input
                id="input-api-alias"
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="예: 본계정, 부계정"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* API 키 입력 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="input-api-key" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  API 키
                </label>
                <span className="text-[9px] text-slate-400">공백 자동제거 · 실시간 형식 검사</span>
              </div>
              <div className="relative">
                <input
                  id="input-api-key"
                  type={showPassword ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value.trim())}
                  placeholder="live_..."
                  className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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

              {/* 실시간 규격 및 중복 검사 인디케이터 */}
              {(() => {
                const trimmed = apiKeyInput.trim();
                if (!trimmed) return null;
                const isDuplicate = keys.some((k) => k.apiKey === trimmed);
                if (isDuplicate) {
                  return (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 animate-in fade-in duration-100">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      이미 등록되어 있는 API 키입니다.
                    </p>
                  );
                }
                const format = checkKeyFormat(trimmed);
                if (!format) return null;
                return format.isValid ? (
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 animate-in fade-in duration-100">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    {format.message}
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in duration-100">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {format.message}
                  </p>
                );
              })()}
            </div>

            {/* 등록 버튼 */}
            <div className="pt-1">
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

          {/* 4. API 키 발급 가이드 */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                NEXON Open API 키 발급 안내
              </span>
              <a
                href="https://openapi.nexon.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>넥슨 Open API 바로가기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-100">openapi.nexon.com</strong> 로그인
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-100">마이페이지 &gt; 내 애플리케이션 등록</strong>에서 [메이플스토리] 선택
              </li>
              <li>
                발급받은 <strong className="text-orange-600 dark:text-orange-400 font-mono">API Key</strong>를 복사하여 위 입력창에 등록
              </li>
            </ol>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
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
  );
};
