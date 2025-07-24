import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// CSRF token için yardımcı fonksiyon
export function getCsrfToken(): string {
    return (window as any).csrf_token || '';
}

// Axios veya fetch için CSRF header'ı
export function getCsrfHeaders(): Record<string, string> {
    return {
        'X-CSRF-TOKEN': getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
    };
}
