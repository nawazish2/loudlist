export function relativeTime(value: string | number | Date, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} HR`;
  return `${Math.floor(hours / 24)} D`;
}
