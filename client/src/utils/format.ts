import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  formatDistanceToNow,
} from 'date-fns'

export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Yesterday'
  if (isThisWeek(date)) return format(date, 'EEE')
  if (isThisYear(date)) return format(date, 'MMM d')
  return format(date, 'MM/dd/yy')
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'HH:mm')
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return `Today at ${format(date, 'HH:mm')}`
  if (isYesterday(date)) return `Yesterday at ${format(date, 'HH:mm')}`
  return format(date, 'MMM d, yyyy HH:mm')
}

export function formatLastSeen(dateStr: string): string {
  const date = new Date(dateStr)
  return `last seen ${formatDistanceToNow(date, { addSuffix: true })}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
