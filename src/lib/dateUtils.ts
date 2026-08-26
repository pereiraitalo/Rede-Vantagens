import { Timestamp } from 'firebase/firestore';

export function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000 + (val.nanoseconds || 0) / 1000000);
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatDate(val: any): string {
  const d = toDate(val);
  if (!d) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch (err) {
    return d.toLocaleDateString('pt-BR');
  }
}

export function formatDateTime(val: any): string {
  const d = toDate(val);
  if (!d) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch (err) {
    return d.toLocaleString('pt-BR');
  }
}

export function dateToInputString(val: any): string {
  const d = toDate(val);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseInputDate(val: string): Date | null {
  if (!val) return null;
  const [year, month, day] = val.split('-').map(Number);
  if (!year || !month || !day) return null;
  // create date in local timezone or midnight
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function isDateOverdue(val: any): boolean {
  const d = toDate(val);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isDateToday(val: any): boolean {
  const d = toDate(val);
  if (!d) return false;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function daysBetween(start: any, end: any): number | null {
  const d1 = toDate(start);
  const d2 = toDate(end);
  if (!d1 || !d2) return null;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
