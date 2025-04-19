import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a filesize in bytes to a human-readable string
 * @param bytes The size in bytes
 * @returns Formatted string (e.g. "4.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats a date string to a human-readable format
 * @param dateString ISO date string to format
 * @param formatStr Optional format string (default: 'dd.MM.yyyy HH:mm')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, formatStr = 'dd.MM.yyyy HH:mm'): string {
  if (!dateString) return '-';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '-';
    
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}
