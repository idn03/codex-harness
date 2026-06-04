export const sessionId = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  const rand = Math.random().toString(36).slice(2, 6);
  return `${yy}-${mm}-${dd}--${hh}-${mi}-${ss}-${rand}`;
};
