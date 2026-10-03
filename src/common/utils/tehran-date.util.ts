export const TEHRAN_TZ = 'Asia/Tehran';
export const TEHRAN_OFFSET = '+03:30';

export function tehranYMD(d: Date | string): string {
  const dt = new Date(d);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TEHRAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt);
}

export function tehranTime(d: Date | string): string {
  const dt = new Date(d);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TEHRAN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dt);
}

export function tehranDateTime(d: Date | string): string {
  return `${tehranYMD(d)} ${tehranTime(d)}`;
}

export function todayTehranYMD(): string {
  return tehranYMD(new Date());
}

export function isPastTehran(dateStr: string): boolean {
  const t = todayTehranYMD();
  return dateStr < t;
}

export function weekdayTehran(dateStr: string): string {
  const dt = new Date(`${dateStr}T12:00:00${TEHRAN_OFFSET}`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TEHRAN_TZ,
    weekday: 'long',
  })
    .format(dt)
    .toLowerCase();
}

export function tehranMidnightUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${TEHRAN_OFFSET}`);
}

export function tehranEndOfDayUtc(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999${TEHRAN_OFFSET}`);
}

export function tehranSlotUtc(dateStr: string, hhmm: string): Date {
  return new Date(`${dateStr}T${hhmm}:00${TEHRAN_OFFSET}`);
}

export function tehranMinutes(d: Date | string): number {
  const t = tehranTime(d);
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function jalaliFa(d: Date | string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: TEHRAN_TZ,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(d));
  } catch {
    return tehranYMD(d);
  }
}

export function jalaliFaWithTime(d: Date | string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: TEHRAN_TZ,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(d));
  } catch {
    return tehranDateTime(d);
  }
}

export function parseHHmm(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

export function fmtMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
