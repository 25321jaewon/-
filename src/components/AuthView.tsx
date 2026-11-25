import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface AuthViewProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string) => Promise<boolean>;
  onBackToBoard: () => void;
  isSubmitting: boolean;
}

export function AuthView({
  onSignIn,
  onSignUp,
  onBackToBoard,
  isSubmitting,
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('이메일 주소를 입력해 주세요.');
      return;
    }
    if (!password) {
      setValidationError('비밀번호를 입력해 주세요.');
      return;
    }

    if (mode === 'login') {
      await onSignIn(trimmedEmail, password);
    } else {
      await onSignUp(trimmedEmail, password);
    }
  };

  return (
    <section className="max-w-md mx-auto py-8 sm:py-12">
      <button
        type="button"
        onClick={onBackToBoard}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors whitespace-nowrap"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>예약 현황판으로 돌아가기</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? '학교 계정 로그인' : '새 계정 회원가입'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            {mode === 'login'
              ? '로그인하면 자습실과 동아리실 좌석을 바로 예약하고 관리할 수 있습니다.'
              : '이메일과 비밀번호를 입력해 교내 자리 예약판 계정을 만드세요.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="인증 방식 선택"
          className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login');
              setValidationError(null);
            }}
            className={`py-2 px-4 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setValidationError(null);
            }}
            className={`py-2 px-4 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              이메일
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 입력 (예: student@school.ac.kr)"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              비밀번호
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {validationError && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {validationError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap"
          >
            {mode === 'login' ? (
              <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isSubmitting
                ? '처리 중...'
                : mode === 'login'
                  ? '로그인하기'
                  : '회원가입하기'}
            </span>
          </button>
        </form>
      </div>
    </section>
  );
}
