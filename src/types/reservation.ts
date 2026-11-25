export interface Reservation {
  id: string;
  user_id: string;
  reserver_handle: string;
  room_name: string;
  seat_number: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  created_at: string;
}

export type ViewMode = 'board' | 'auth';

export type ReservationFilter = 'slot' | 'date' | 'mine';

export interface BannerState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export interface RoomConfig {
  name: string;
  description: string;
  seats: string[];
  columns: number;
}

export const MAX_RESERVATION_MINUTES = 210; // 3시간 30분

export const DURATION_PRESETS = [
  { label: '30분', minutes: 30 },
  { label: '1시간', minutes: 60 },
  { label: '2시간', minutes: 120 },
  { label: '3시간 30분', minutes: 210 },
];

export function formatTimeShort(timeStr: string): string {
  return timeStr ? timeStr.slice(0, 5) : '';
}

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDurationKorean(minutes: number): string {
  if (minutes <= 0) return '0분';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
  if (hours > 0) return `${hours}시간`;
  return `${mins}분`;
}

export const ROOMS: RoomConfig[] = [
  {
    name: '본관 자습실',
    description: '개인 집중 학습을 위한 정숙 자습 공간 (16석)',
    seats: [
      'A1', 'A2', 'A3', 'A4',
      'B1', 'B2', 'B3', 'B4',
      'C1', 'C2', 'C3', 'C4',
      'D1', 'D2', 'D3', 'D4',
    ],
    columns: 4,
  },
  {
    name: '도서관 열람실',
    description: '참고서 열람 및 과제 수행 공간 (16석)',
    seats: [
      'A1', 'A2', 'A3', 'A4',
      'B1', 'B2', 'B3', 'B4',
      'C1', 'C2', 'C3', 'C4',
      'D1', 'D2', 'D3', 'D4',
    ],
    columns: 4,
  },
  {
    name: '동아리실 A',
    description: '소규모 팀 프로젝트 및 동아리 회의 공간 (8석)',
    seats: ['1번', '2번', '3번', '4번', '5번', '6번', '7번', '8번'],
    columns: 4,
  },
  {
    name: '동아리실 B',
    description: '토론·발표 연습 및 동아리 활동 공간 (8석)',
    seats: ['1번', '2번', '3번', '4번', '5번', '6번', '7번', '8번'],
    columns: 4,
  },
];
