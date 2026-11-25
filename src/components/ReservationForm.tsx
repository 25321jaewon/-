import { CalendarCheck, LogIn, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  MAX_RESERVATION_MINUTES,
  formatDurationKorean,
  formatTimeShort,
  type Reservation,
} from '../types/reservation';

interface ReservationFormProps {
  isLoggedIn: boolean;
  isSubmitting: boolean;
  roomName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  selectedSeat: string | null;
  existingReservation: Reservation | null;
  currentUserId: string | null;
  onCreateReservation: (input: {
    room_name: string;
    seat_number: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    purpose: string;
  }) => Promise<boolean>;
  onCancelReservation: (reservation: Reservation) => Promise<void>;
  onGoToAuth: () => void;
}

export function ReservationForm({
  isLoggedIn,
  isSubmitting,
  roomName,
  reservationDate,
  startTime,
  endTime,
  durationMinutes,
  selectedSeat,
  existingReservation,
  currentUserId,
  onCreateReservation,
  onCancelReservation,
  onGoToAuth,
}: ReservationFormProps) {
  const [purpose, setPurpose] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isReservedByMine = Boolean(
    existingReservation && currentUserId && existingReservation.user_id === currentUserId
  );

  const isDurationValid =
    durationMinutes > 0 && durationMinutes <= MAX_RESERVATION_MINUTES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedSeat) {
      setValidationError('좌석 배치도에서 예약할 좌석을 먼저 선택해 주세요.');
      return;
    }

    if (durationMinutes <= 0) {
      setValidationError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    if (durationMinutes > MAX_RESERVATION_MINUTES) {
      setValidationError('예약 시간은 최대 3시간 30분(210분)까지만 선택할 수 있습니다.');
      return;
    }

    const trimmedPurpose = purpose.trim();
    if (!trimmedPurpose) {
      setValidationError('이용 목적 또는 메모를 입력해 주세요.');
      return;
    }

    const ok = await onCreateReservation({
      room_name: roomName,
      seat_number: selectedSeat,
      reservation_date: reservationDate,
      start_time: startTime,
      end_time: endTime,
      purpose: trimmedPurpose,
    });

    if (ok) {
      setPurpose('');
    }
  };

  return (
    <aside
      aria-label="선택 좌석 예약 패널"
      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6 h-full"
    >
      <div className="space-y-4">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">자리 예약하기</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            원하는 시간(최대 3시간 30분)과 좌석을 선택해 예약하세요.
          </p>
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">공간</dt>
            <dd className="font-semibold text-slate-900">{roomName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">날짜</dt>
            <dd className="font-mono-num font-semibold text-slate-900">{reservationDate}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">이용 시간</dt>
            <dd className="font-mono-num font-semibold text-slate-900 text-right">
              {startTime} ~ {endTime}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">총 시간</dt>
            <dd
              className={`font-semibold text-right ${
                isDurationValid ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {durationMinutes > 0
                ? `${formatDurationKorean(durationMinutes)} (최대 3시간 30분)`
                : '시간 선택 오류'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <dt className="text-slate-500">선택 좌석</dt>
            <dd className="text-lg font-bold font-mono-num text-blue-700">
              {selectedSeat ?? '미선택'}
            </dd>
          </div>
        </dl>

        {existingReservation && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">겹치는 예약이 있습니다</span>
              {isReservedByMine && (
                <span className="px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                  내 예약
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-mono-num">
              시간: {formatTimeShort(existingReservation.start_time)} ~{' '}
              {formatTimeShort(existingReservation.end_time)}
            </p>
            <p className="text-xs text-slate-600">
              예약자: {existingReservation.reserver_handle || '사용자'}
            </p>
            <p className="text-xs text-slate-700 break-words">
              목적: {existingReservation.purpose}
            </p>
            {isReservedByMine && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void onCancelReservation(existingReservation)}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>이 자리 예약 취소</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!isLoggedIn ? (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            예약 현황은 누구나 볼 수 있으며, 좌석을 예약하려면 학교 계정으로 로그인해야 합니다.
          </p>
          <button
            type="button"
            onClick={onGoToAuth}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>로그인하고 자리 예약하기</span>
          </button>
        </div>
      ) : existingReservation ? (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            {isReservedByMine
              ? '선택한 시간대에 이미 본인이 예약한 좌석입니다. 다른 좌석이나 겹치지 않는 시간대를 선택해 주세요.'
              : '선택한 시간대에 다른 학우가 이미 예약한 좌석입니다. 빈 좌석이나 다른 시간대를 선택해 주세요.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-100 space-y-3" noValidate>
          <div>
            <label
              htmlFor="reservation-purpose"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              이용 목적 / 메모
            </label>
            <input
              id="reservation-purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="예: 수학 모의고사 자습, 과학 동아리 회의"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {!isDurationValid && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {durationMinutes <= 0
                ? '종료 시간은 시작 시간보다 뒤여야 합니다.'
                : '최대 예약 가능 시간은 3시간 30분(210분)입니다.'}
            </p>
          )}

          {validationError && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {validationError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isDurationValid}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <CalendarCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isSubmitting ? '예약 처리 중...' : '선택한 자리 예약하기'}</span>
          </button>
        </form>
      )}
    </aside>
  );
}
