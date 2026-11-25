import type { Session } from '@supabase/supabase-js';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthView } from './components/AuthView';
import { ReservationCard } from './components/ReservationCard';
import { ReservationForm } from './components/ReservationForm';
import { SeatMap } from './components/SeatMap';
import { StatusBanner } from './components/StatusBanner';
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigErrorMessage,
} from './lib/supabase';
import {
  DURATION_PRESETS,
  MAX_RESERVATION_MINUTES,
  ROOMS,
  formatDurationKorean,
  minutesToTimeString,
  timeToMinutes,
  type BannerState,
  type Reservation,
  type ReservationFilter,
  type ViewMode,
} from './types/reservation';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [selectedRoomName, setSelectedRoomName] = useState<string>(ROOMS[0].name);
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [selectedSeat, setSelectedSeat] = useState<string | null>('A1');
  const [listFilter, setListFilter] = useState<ReservationFilter>('slot');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const bannerTimerRef = useRef<number | null>(null);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setBanner(null);
  }, []);

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current);
    }
    setBanner({
      id: Date.now() + Math.random(),
      type,
      message,
    });
    bannerTimerRef.current = window.setTimeout(() => {
      setBanner(null);
      bannerTimerRef.current = null;
    }, 6000);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const fetchReservations = useCallback(
    async (options?: { silentSuccess?: boolean }) => {
      if (!supabase) {
        setIsLoading(false);
        showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          showBanner('error', error.message);
          return;
        }

        const list = (data ?? []) as Reservation[];
        setReservations(list);
        if (!options?.silentSuccess) {
          showBanner('success', `예약 현황 ${list.length}건을 불러왔습니다.`);
        }
      } catch (err) {
        showBanner('error', err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [showBanner]
  );

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setIsLoading(false);
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return;
    }

    let isMounted = true;

    const init = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (!isMounted) return;
        if (error) {
          showBanner('error', error.message);
        } else {
          setSession(data.session);
        }
      } catch (err) {
        if (isMounted) {
          showBanner('error', err instanceof Error ? err.message : String(err));
        }
      }

      if (isMounted) {
        await fetchReservations();
      }
    };

    void init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchReservations, showBanner]);

  const currentRoom = useMemo(
    () => ROOMS.find((room) => room.name === selectedRoomName) ?? ROOMS[0],
    [selectedRoomName]
  );

  useEffect(() => {
    if (!currentRoom.seats.includes(selectedSeat ?? '')) {
      setSelectedSeat(currentRoom.seats[0] ?? null);
    }
  }, [currentRoom, selectedSeat]);

  const startMinutes = useMemo(() => timeToMinutes(startTime), [startTime]);
  const endMinutes = useMemo(() => timeToMinutes(endTime), [endTime]);
  const durationMinutes = endMinutes - startMinutes;
  const isDurationValid =
    durationMinutes > 0 && durationMinutes <= MAX_RESERVATION_MINUTES;

  const reservationsForSlot = useMemo(() => {
    if (endMinutes <= startMinutes) {
      return reservations.filter(
        (item) =>
          item.reservation_date === selectedDate &&
          item.room_name === selectedRoomName
      );
    }

    return reservations.filter((item) => {
      if (
        item.reservation_date !== selectedDate ||
        item.room_name !== selectedRoomName
      ) {
        return false;
      }
      const itemStart = timeToMinutes(item.start_time);
      const itemEnd = timeToMinutes(item.end_time);
      return itemStart < endMinutes && itemEnd > startMinutes;
    });
  }, [
    reservations,
    selectedDate,
    selectedRoomName,
    startMinutes,
    endMinutes,
  ]);

  const selectedSeatReservation = useMemo(() => {
    if (!selectedSeat) return null;
    return (
      reservationsForSlot.find((item) => item.seat_number === selectedSeat) ?? null
    );
  }, [reservationsForSlot, selectedSeat]);

  const currentUserId = session?.user?.id ?? null;
  const currentUserEmail = session?.user?.email ?? null;
  const currentUserHandle = currentUserEmail ? currentUserEmail.split('@')[0] : null;

  const filteredReservations = useMemo(() => {
    if (listFilter === 'slot') {
      return reservationsForSlot;
    }
    if (listFilter === 'date') {
      return reservations.filter((item) => item.reservation_date === selectedDate);
    }
    return reservations.filter(
      (item) => currentUserId && item.user_id === currentUserId
    );
  }, [listFilter, reservations, reservationsForSlot, selectedDate, currentUserId]);

  const handleApplyDurationPreset = (minutes: number) => {
    const nextEnd = startMinutes + minutes;
    setEndTime(minutesToTimeString(nextEnd));
  };

  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return false;
    }

    setIsSubmittingAuth(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showBanner('error', error.message);
        return false;
      }

      setSession(data.session);
      setViewMode('board');
      showBanner('success', `${data.user?.email ?? email} 계정으로 로그인했습니다.`);
      return true;
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignUp = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return false;
    }

    setIsSubmittingAuth(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        showBanner('error', error.message);
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setViewMode('board');
        showBanner(
          'success',
          `${data.user?.email ?? email} 회원가입 및 로그인이 완료되었습니다.`
        );
      } else {
        showBanner(
          'success',
          `${data.user?.email ?? email} 회원가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.`
        );
      }
      return true;
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showBanner('error', error.message);
        return;
      }
      setSession(null);
      showBanner('success', '로그아웃되었습니다.');
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
    }
  };

  const handleCreateReservation = async (input: {
    room_name: string;
    seat_number: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    purpose: string;
  }): Promise<boolean> => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return false;
    }

    const mins = timeToMinutes(input.end_time) - timeToMinutes(input.start_time);
    if (mins <= 0 || mins > MAX_RESERVATION_MINUTES) {
      showBanner(
        'error',
        '예약 시간은 최소 1분 이상, 최대 3시간 30분(210분)까지만 가능합니다.'
      );
      return false;
    }

    setIsBooking(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          room_name: input.room_name,
          seat_number: input.seat_number,
          reservation_date: input.reservation_date,
          start_time: input.start_time,
          end_time: input.end_time,
          purpose: input.purpose,
        })
        .select();

      if (error) {
        showBanner('error', error.message);
        return false;
      }

      if (data && data.length > 0) {
        setReservations((prev) => [data[0] as Reservation, ...prev]);
      } else {
        await fetchReservations({ silentSuccess: true });
      }

      showBanner(
        'success',
        `${input.room_name} ${input.seat_number} 좌석(${input.reservation_date} · ${input.start_time}~${input.end_time}) 예약이 완료되었습니다.`
      );
      return true;
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsBooking(false);
    }
  };

  const handleUpdatePurpose = async (
    reservation: Reservation,
    newPurpose: string
  ) => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return;
    }

    if (!currentUserId || reservation.user_id !== currentUserId) {
      showBanner('error', '본인이 예약한 좌석만 수정할 수 있습니다.');
      return;
    }

    setBusyReservationId(reservation.id);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ purpose: newPurpose })
        .eq('id', reservation.id)
        .select();

      if (error) {
        showBanner('error', error.message);
        return;
      }

      if (!data || data.length === 0) {
        showBanner(
          'error',
          `${reservation.room_name} ${reservation.seat_number} 예약 수정 실패: 본인 예약만 수정할 수 있습니다.`
        );
        return;
      }

      const updated = data[0] as Reservation;
      setReservations((prev) =>
        prev.map((item) => (item.id === reservation.id ? updated : item))
      );
      showBanner(
        'success',
        `${reservation.room_name} ${reservation.seat_number} 예약 목적이 수정되었습니다.`
      );
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
    } finally {
      setBusyReservationId(null);
    }
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    if (!supabase) {
      showBanner('error', supabaseConfigErrorMessage ?? 'Supabase 설정이 필요합니다.');
      return;
    }

    if (!currentUserId || reservation.user_id !== currentUserId) {
      showBanner('error', '다른 계정이 예약한 자리는 취소할 수 없습니다.');
      return;
    }

    setBusyReservationId(reservation.id);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation.id)
        .select();

      if (error) {
        showBanner('error', error.message);
        return;
      }

      if (!data || data.length === 0) {
        showBanner(
          'error',
          `${reservation.room_name} ${reservation.seat_number} 취소 실패: 본인 예약만 취소할 수 있습니다.`
        );
        return;
      }

      setReservations((prev) =>
        prev.filter((item) => item.id !== reservation.id)
      );
      showBanner(
        'success',
        `${reservation.room_name} ${reservation.seat_number} 좌석 예약이 취소되었습니다.`
      );
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : String(err));
    } finally {
      setBusyReservationId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#101828]">
      <StatusBanner banner={banner} onDismiss={dismissBanner} />

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors"
          >
            교내 자리 예약판
          </button>

          <nav
            aria-label="주요 메뉴"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'board' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              예약 현황판
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('board');
                setListFilter('mine');
                window.setTimeout(() => {
                  document
                    .getElementById('reservation-list-section')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              내 예약 보기
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'auth' ? 'board' : 'auth')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'auth' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              로그인 화면
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            {session ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                로그아웃
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'auth' ? 'board' : 'auth')}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {viewMode === 'auth' ? '예약 현황판' : '로그인 / 회원가입'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {!isSupabaseConfigured && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800"
          >
            <p className="font-semibold">환경변수 설정 안내</p>
            <p className="mt-1">
              {supabaseConfigErrorMessage} 프로젝트 환경변수에 두 값을 입력한 뒤 새로고침해 주세요.
            </p>
          </div>
        )}

        {viewMode === 'auth' ? (
          <AuthView
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onBackToBoard={() => setViewMode('board')}
            isSubmitting={isSubmittingAuth}
          />
        ) : (
          <>
            <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-balance">
                  학교 자습실·동아리실 자리 예약판
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  {session
                    ? `${currentUserHandle}님으로 로그인되어 있습니다. 원하는 시간을 선택(최대 3시간 30분)하고 빈 좌석을 예약하세요.`
                    : '로그인하지 않아도 자습실·동아리실의 실시간 좌석 현황을 확인할 수 있습니다.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => void fetchReservations()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>현황 새로고침</span>
                </button>
              </div>
            </section>

            <section
              aria-label="날짜·공간·시간 선택"
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-3">
                  <label
                    htmlFor="filter-date"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    예약 날짜
                  </label>
                  <div className="relative">
                    <Calendar
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="filter-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="lg:col-span-9">
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                    공간 선택
                  </span>
                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
                    {ROOMS.map((room) => (
                      <button
                        key={room.name}
                        type="button"
                        onClick={() => setSelectedRoomName(room.name)}
                        className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          selectedRoomName === room.name
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-3">
                  <label
                    htmlFor="start-time"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    시작 시간
                  </label>
                  <div className="relative">
                    <Clock
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label
                    htmlFor="end-time"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    종료 시간
                  </label>
                  <div className="relative">
                    <Clock
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">
                      이용 시간 빠른 선택 (최대 3시간 30분)
                    </span>
                    <span
                      className={`text-xs font-semibold font-mono-num ${
                        isDurationValid ? 'text-blue-700' : 'text-red-600'
                      }`}
                    >
                      {durationMinutes > 0
                        ? `선택: ${formatDurationKorean(durationMinutes)}`
                        : '종료 시간 확인 필요'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.minutes}
                        type="button"
                        onClick={() => handleApplyDurationPreset(preset.minutes)}
                        className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          durationMinutes === preset.minutes
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              aria-label="좌석 배치도 및 예약 신청"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              <div className="lg:col-span-7">
                <SeatMap
                  room={currentRoom}
                  reservationsForSlot={reservationsForSlot}
                  selectedSeat={selectedSeat}
                  currentUserId={currentUserId}
                  onSelectSeat={setSelectedSeat}
                />
              </div>

              <div className="lg:col-span-5">
                <ReservationForm
                  isLoggedIn={Boolean(session)}
                  isSubmitting={isBooking || busyReservationId !== null}
                  roomName={selectedRoomName}
                  reservationDate={selectedDate}
                  startTime={startTime}
                  endTime={endTime}
                  durationMinutes={durationMinutes}
                  selectedSeat={selectedSeat}
                  existingReservation={selectedSeatReservation}
                  currentUserId={currentUserId}
                  onCreateReservation={handleCreateReservation}
                  onCancelReservation={handleCancelReservation}
                  onGoToAuth={() => setViewMode('auth')}
                />
              </div>
            </section>

            <section
              id="reservation-list-section"
              aria-label="예약 내역 목록"
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-bold text-slate-900">예약 내역</h2>
                  <span className="text-sm text-slate-500 font-mono-num">
                    {filteredReservations.length}건
                  </span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setListFilter('slot')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      listFilter === 'slot'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    겹치는 시간대
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFilter('date')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      listFilter === 'date'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    선택 날짜 전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFilter('mine')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      listFilter === 'mine'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    내 예약만
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                  예약 현황을 불러오는 중입니다...
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <p className="text-base font-semibold text-slate-800">
                    표시할 예약 내역이 없습니다.
                  </p>
                  <p className="mt-1.5 text-sm text-slate-500">
                    위 좌석 배치도에서 빈 좌석을 선택해 첫 예약을 등록해 보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      currentUserId={currentUserId}
                      currentUserEmail={currentUserEmail}
                      onUpdatePurpose={handleUpdatePurpose}
                      onCancel={handleCancelReservation}
                      isBusy={busyReservationId === reservation.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>교내 자리 예약판 · 자습실·동아리실 통합 관리</p>
          <p>최대 3시간 30분 예약 제한 및 시간대 중복 방지·RLS 보호가 적용됩니다.</p>
        </div>
      </footer>
    </div>
  );
}
